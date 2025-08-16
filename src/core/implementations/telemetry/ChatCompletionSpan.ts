import { Span, SpanKind, SpanStatusCode } from "@opentelemetry/api"
import OpenAI from "openai"
import { SemanticKernelTelemetry } from "./SemanticKernelTelemetry"
import { SemanticKernelTelemetrySpan } from "./SemanticKernelTelemetrySpan"

export class ChatCompletionSpan extends SemanticKernelTelemetrySpan {
  constructor(
    span: Span,
    reactorContextModifier: (ctx: any) => any,
    spanScope: { close: () => void },
    contextScope: { close: () => void }
  ) {
    super(span, reactorContextModifier, spanScope, contextScope)
  }

  public static startChatCompletionSpan(
    telemetry: SemanticKernelTelemetry,
    contextView: any,
    modelName: string | null,
    modelProvider: string,
    maxTokens: number | null,
    temperature: number | null,
    topP: number | null
  ): ChatCompletionSpan {
    return this.startCompletionSpan(
      telemetry,
      contextView,
      "chat.completions",
      modelName,
      modelProvider,
      maxTokens,
      temperature,
      topP
    )
  }

  public startTextCompletionSpan(
    telemetry: SemanticKernelTelemetry,
    contextView: any,
    modelName: string | null,
    modelProvider: string,
    maxTokens: number | null,
    temperature: number | null,
    topP: number | null
  ): ChatCompletionSpan {
    return ChatCompletionSpan.startCompletionSpan(
      telemetry,
      contextView,
      "text.completions",
      modelName,
      modelProvider,
      maxTokens,
      temperature,
      topP
    )
  }

  public static startCompletionSpan(
    telemetry: SemanticKernelTelemetry,
    contextView: any,
    operationName: string,
    modelName: string | null,
    modelProvider: string,
    maxTokens: number | null,
    temperature: number | null,
    topP: number | null
  ): ChatCompletionSpan {
    const finalModelName = modelName ?? "unknown"
    const tracer = telemetry.tracer

    const span = tracer.startSpan(`${operationName} ${finalModelName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        "gen_ai.request.model": finalModelName,
        "gen_ai.operation.name": operationName,
        "gen_ai.system": modelProvider,
        ...(maxTokens !== null && { "gen_ai.request.max_tokens": maxTokens }),
        ...(temperature !== null && {
          "gen_ai.request.temperature": temperature,
        }),
        ...(topP !== null && { "gen_ai.request.top_p": topP }),
      },
    })

    const contextModifier = (ctx: any) => ({ ...ctx, span })
    const spanScope = { close: () => span.end() }
    const contextScope = { close: () => {} }

    return new ChatCompletionSpan(span, contextModifier, spanScope, contextScope)
  }

  public endSpanWithUsage(chatCompletions: OpenAI.ChatCompletion): void {
    const usage: OpenAI.CompletionUsage | undefined = chatCompletions.usage
    if (usage) {
      this.span.setAttributes({
        "gen_ai.usage.output_tokens": usage.completion_tokens,
        "gen_ai.usage.input_tokens": usage.prompt_tokens,
        "gen_ai.usage.total_tokens": usage.total_tokens,
      })
    }
    this.span.setStatus({ code: SpanStatusCode.OK })
    this.close()
  }

  public endSpanWithError(error: Error): void {
    this.span.recordException(error)
    this.span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    })
    this.close()
  }
}
