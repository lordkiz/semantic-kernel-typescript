import { trace, context, Span, Context, SpanOptions } from "@opentelemetry/api";
import Closeable from "../../ds/Closeable";
import { Logger } from "../../log/Logger";
import RXJS from "rxjs";

export interface SpanConstructor<T extends SemanticKernelTelemetrySpan> {
  build(
    contextModifier: (ctx: any) => any,
    spanScope: SemanticKernelTelemetrySpan,
    contextScope: SemanticKernelTelemetrySpan
  ): T;
}

export default abstract class SemanticKernelTelemetrySpan implements Closeable {
  private LOGGER = Logger;

  private static readonly SPAN_TIMEOUT_MS = parseInt(
    process.env.SEMANTICKERNEL_TELEMETRY_SPAN_TIMEOUT || "120000"
  );

  private readonly span: Span;
  private readonly reactorContextModifier: (ctx: any) => any;
  private readonly spanScope: { close: () => void };
  private readonly contextScope: { close: () => void };
  private closed: boolean = false;
  private finalizerGuardian: FinalizationRegistry<string>;

  // Timeout to close the span if it was not closed within the specified time to avoid memory leaks
  private watchdog: RXJS.Subscription;

  constructor(
    span: Span,
    reactorContextModifier: (ctx: any) => any,
    spanScope: { close: () => void },
    contextScope: { close: () => void }
  ) {
    this.span = span;
    this.reactorContextModifier = reactorContextModifier;
    this.spanScope = spanScope;
    this.contextScope = contextScope;

    this.watchdog = RXJS.of(1)
      .pipe(RXJS.delay(SemanticKernelTelemetrySpan.SPAN_TIMEOUT_MS))
      .subscribe({
        complete: this.closeOnInactivity,
      });

    // Finalizer guardian to ensure span closure
    this.finalizerGuardian = new FinalizationRegistry((heldValue) => {
      if (!this.closed && heldValue === "span") {
        console.warn("Span was not closed");
        this.close();
      }
    });
    this.finalizerGuardian.register(this, "span");
  }

  // static build<T extends SemanticKernelTelemetrySpan>(
  //   span: Span,
  //   contextView: any,
  //   builder: SpanConstructor<T>
  // ): T {
  //   console.trace(`Starting Span: ${span}`);

  //   const currentOtelContext = context.active();
  //   const otelContext = trace.setSpan(currentOtelContext, span);

  //   const contextScope = context.bind(otelContext, this);
  //   const spanScope = context.bind(trace.setSpan(context.active(), span), this);

  //   const reactorContextModifier = (ctx: any) => {
  //     return {
  //       ...ctx,
  //       otelContext: otelContext,
  //     };
  //   };

  //   return builder.build(
  //     reactorContextModifier,
  //     spanScope as any,
  //     contextScope as any
  //   );
  // }

  getReactorContextModifier(): (ctx: any) => any {
    return this.reactorContextModifier;
  }

  close() {
    if (!this.closed) {
      this.closed = true;
      this.LOGGER.info("Closing span:", this.span);
      if (this.span.isRecording()) {
        try {
          this.span.end();
        } catch (e) {
          this.LOGGER.error("Error closing span", e);
        }
      }
      try {
        this.contextScope?.close();
      } catch (e) {
        this.LOGGER.error("Error closing context scope", e);
      }

      try {
        this.spanScope.close();
      } catch (e) {
        this.LOGGER.error("Error closing span scope", e);
      }

      this.watchdog.unsubscribe();
      this.finalizerGuardian.unregister(this);
    }
  }

  getSpan() {
    return this.span;
  }

  private closeOnInactivity() {
    if (!this.closed) {
      Logger.warn("Span was not closed, timing out");
      this.close();
    }
  }
}
