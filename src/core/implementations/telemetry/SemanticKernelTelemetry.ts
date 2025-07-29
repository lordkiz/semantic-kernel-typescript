import { SpanContext, trace, Tracer } from "@opentelemetry/api"
import InvocationContext from "../../orchestration/InvocationContext"

export default class SemanticKernelTelemetry {
  static OPEN_AI_PROVIDER = "openai"

  private tracer: Tracer

  private spanContext: SpanContext | undefined

  constructor()
  constructor(tracer: Tracer)
  constructor(tracer?: Tracer, spanContext?: SpanContext) {
    this.tracer = tracer || trace.getTracer("SemanticKernel")
    this.spanContext = spanContext
  }

  static getTelemetry(invocationContext: InvocationContext): SemanticKernelTelemetry {
    return invocationContext.telemetry ?? new SemanticKernelTelemetry()
  }

  private getTracer() {
    return this.tracer
  }
}
