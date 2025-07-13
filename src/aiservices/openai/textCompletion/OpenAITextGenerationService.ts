import OpenAI from "openai"
import { CompletionCreateParams } from "openai/resources"
import { from, map, mergeMap, Observable } from "rxjs"
import AIException from "../../../semantickernel/exceptions/AIException"
import Kernel from "../../../semantickernel/Kernel"
import FunctionResultMetadata from "../../../semantickernel/orchestration/FunctionResultMetadata"
import PromptExecutionSettings from "../../../semantickernel/orchestration/PromptExecutionSettings"
import StreamingTextContent from "../../../semantickernel/services/StreamingTextContent"
import TextContent from "../../../semantickernel/services/textcompletion/TextContent"
import { TextGenerationService } from "../../../semantickernel/services/textcompletion/TextGenerationService"
import OpenAIRequestSettings from "../implementation/OpenAIRequestSettings"
import { OpenAIService } from "../OpenAIService"
import OpenAIStreamingTextContent from "./OpenAIStreamingTextContent"

export default class OpenAITextGenerationService
  extends OpenAIService<OpenAI>
  implements TextGenerationService
{
  constructor(client: OpenAI, modelId: string, deploymentName: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder() {
    return new OpenAITextGenerationServiceBuilder()
  }

  getTextContentsAsync(
    prompt: string,
    kernel?: Kernel,
    executionSettings?: PromptExecutionSettings
  ): Observable<TextContent[]> {
    return this._completeTextAsyncImpl(prompt, executionSettings)
  }

  getStreamingTextContentsAsync(
    prompt: string,
    kernel?: Kernel,
    executionSettings?: PromptExecutionSettings
  ): Observable<StreamingTextContent<TextContent>> {
    return this._completeTextAsyncImpl(prompt, executionSettings).pipe(
      mergeMap((it) => it),
      map((it) => new OpenAIStreamingTextContent(it))
    )
  }

  private _completeTextAsyncImpl(
    text: string,
    requestSettings?: PromptExecutionSettings
  ): Observable<TextContent[]> {
    const completionOptions = this.getCompletionsOptions(text, requestSettings)

    return from(
      this.getClient().completions.create(
        completionOptions,
        OpenAIRequestSettings.getRequestOptions()
      )
    ).pipe(
      map((c) => {
        const completions = c as OpenAI.Completions.Completion
        const metadata = FunctionResultMetadata.build(
          completions.id,
          completions.usage ?? {},
          completions.created
        )
        return completions.choices.map(
          (choice) => new TextContent(choice.text, completions.model, metadata)
        )
      })
    )
  }

  private getCompletionsOptions(
    text: string,
    requestSettings?: PromptExecutionSettings
  ): CompletionCreateParams {
    if (requestSettings?.getMaxTokens() ?? 0 < 1) {
      throw new AIException(AIException.ErrorCodes.INVALID_REQUEST, "Max tokens must be > 0")
    }

    if (
      (requestSettings?.getResultsPerPrompt() ?? 0) < 1 ||
      (requestSettings?.getResultsPerPrompt() ?? Number.MAX_SAFE_INTEGER) >
        TextGenerationService.MAX_RESULTS_PER_PROMPT
    ) {
      throw new AIException(
        AIException.ErrorCodes.INVALID_REQUEST,
        `Results per prompt must be in range between 1 and ${TextGenerationService.MAX_RESULTS_PER_PROMPT}, inclusive.`
      )
    }

    return {
      ...requestSettings?.json(),
      prompt: text,
      model: this.getModelId(),
    }
  }
}

export class OpenAITextGenerationServiceBuilder {}
