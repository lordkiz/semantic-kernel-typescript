import OpenAI from "openai"
import { AudioResponseFormat } from "openai/resources.mjs"
import { from, map, Observable } from "rxjs"
import SKException from "../../../semantickernel/exceptions/SKException"
import { Logger } from "../../../semantickernel/log/Logger"
import AudioContent from "../../../semantickernel/services/audio/AudioContent"
import AudioToTextExecutionSettings from "../../../semantickernel/services/audio/AudioToTextExecutionSettings"
import { AudioToTextService } from "../../../semantickernel/services/audio/types/AudioToTextService"
import { OpenAIService } from "../OpenAIService"

export default class OpenAiAudioToTextService
  extends OpenAIService<OpenAI>
  implements AudioToTextService
{
  constructor(client: OpenAI, modelId: string, deploymentName: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder(): OpenAiAudioToTextServiceBuilder {
    return new OpenAiAudioToTextServiceBuilder()
  }

  getTextContentsAsync(
    content: AudioContent,
    executionSettings: AudioToTextExecutionSettings
  ): Observable<string> {
    const options = this.convertOptions(content, executionSettings)
    return from(this.getClient().audio.transcriptions.create(options)).pipe(map((it) => it.text))
  }

  private convertOptions(content: AudioContent, executionSettings: AudioToTextExecutionSettings) {
    return {
      model: this.getModelId(),
      response_format: (executionSettings?.getResponseFormat() ?? "json") as AudioResponseFormat,
      file: content.getData(),
      language: executionSettings?.getLanguage(),
      prompt: executionSettings?.getPrompt(),
    }
  }
}

export class OpenAiAudioToTextServiceBuilder {
  private LOGGER = Logger
  private client: OpenAI | undefined
  private modelId: string | undefined
  private deploymentName: string | undefined

  withClient(client: OpenAI): this {
    this.client = client
    return this
  }

  withModelId(modelId: string): this {
    this.modelId = modelId
    return this
  }

  withDeploymentName(deploymentName: string): this {
    this.deploymentName = deploymentName
    return this
  }

  build(): OpenAiAudioToTextService {
    if (this.client == null) {
      throw new SKException("OpenAI client is required")
    }

    if (this.modelId == null) {
      throw new SKException("Model id is required")
    }

    if (this.deploymentName == null) {
      this.LOGGER.debug("Deployment name is not provided, using model id as deployment name")
      this.deploymentName = this.modelId
    }

    return new OpenAiAudioToTextService(this.client, this.modelId, this.deploymentName)
  }
}
