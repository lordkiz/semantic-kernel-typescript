import { Span } from "@opentelemetry/api"
import RXJS from "rxjs"
import Closeable from "../../ds/Closeable"
import { Logger } from "../../log/Logger"

export interface SpanConstructor<T extends SemanticKernelTelemetrySpan> {
  build(
    contextModifier: (ctx: any) => any,
    spanScope: SemanticKernelTelemetrySpan,
    contextScope: SemanticKernelTelemetrySpan
  ): T
}

export default abstract class SemanticKernelTelemetrySpan implements Closeable {
  private static readonly SPAN_TIMEOUT_MS = parseInt(
    process.env.SEMANTIC_KERNEL_TELEMETRY_SPAN_TIMEOUT || "120000"
  )

  private readonly _span: Span
  private readonly _reactorContextModifier: (ctx: any) => any
  private readonly _spanScope: { close: () => void }
  private readonly _contextScope: { close: () => void }
  private _closed: boolean = false
  private _finalizerGuardian: FinalizationRegistry<string>

  // Timeout to close the span if it was not closed within the specified time to avoid memory leaks
  private watchdog: RXJS.Subscription

  constructor(
    span: Span,
    reactorContextModifier: (ctx: any) => any,
    spanScope: { close: () => void },
    contextScope: { close: () => void }
  ) {
    this._span = span
    this._reactorContextModifier = reactorContextModifier
    this._spanScope = spanScope
    this._contextScope = contextScope

    this.watchdog = RXJS.of(1)
      .pipe(RXJS.delay(SemanticKernelTelemetrySpan.SPAN_TIMEOUT_MS))
      .subscribe({
        complete: this.closeOnInactivity,
      })

    // Finalizer guardian to ensure span closure
    this._finalizerGuardian = new FinalizationRegistry((heldValue) => {
      if (!this._closed && heldValue === "span") {
        console.warn("Span was not closed")
        this.close()
      }
    })
    this._finalizerGuardian.register(this, "span")
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

  get reactorContextModifier(): (ctx: any) => any {
    return this._reactorContextModifier
  }

  close() {
    if (!this._closed) {
      this._closed = true
      Logger.info("Closing span:", this._span)
      if (this._span.isRecording()) {
        try {
          this._span.end()
        } catch (e) {
          Logger.error("Error closing span", e)
        }
      }
      try {
        this._contextScope?.close()
      } catch (e) {
        Logger.error("Error closing context scope", e)
      }

      try {
        this._spanScope.close()
      } catch (e) {
        Logger.error("Error closing span scope", e)
      }

      this.watchdog.unsubscribe()
      this._finalizerGuardian.unregister(this)
    }
  }

  get span() {
    return this._span
  }

  private closeOnInactivity() {
    if (!this._closed) {
      Logger.warn("Span was not closed, timing out")
      this.close()
    }
  }
}
