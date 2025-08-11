import { SpanContext, trace, Tracer } from "@opentelemetry/api"
import InvocationContext from "../../orchestration/InvocationContext"

export default class SemanticKernelTelemetry {
  private _tracer: Tracer

  private _spanContext: SpanContext | undefined

  constructor()
  constructor(tracer: Tracer)
  constructor(tracer?: Tracer, spanContext?: SpanContext) {
    this._tracer = tracer || trace.getTracer(SemanticKernelTelemetry.TRACER_NAME)
    this._spanContext = spanContext
  }

  static TRACER_NAME = "semantic-kernel-typescript"

  static getTelemetry(invocationContext: InvocationContext): SemanticKernelTelemetry {
    return invocationContext.telemetry ?? new SemanticKernelTelemetry()
  }

  get tracer() {
    return this._tracer
  }

  get spanContext() {
    return this._spanContext
  }
}
