import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import {
  AudioContent,
  TextToAudioExecutionSettings,
  type TextToAudioService,
} from "@semantic-kernel-typescript/core/services/audio"
import OpenAI from "openai"
import { SpeechCreateParams } from "openai/resources/audio.js"
import { from, map, mergeMap, Observable } from "rxjs"
import { OpenAIService } from "../OpenAIService"

export default class OpenAiTextToAudioService
  extends OpenAIService<OpenAI>
  implements TextToAudioService
{
  constructor(client: OpenAI, modelId: string, deploymentName: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder(): OpenAiAudioToTextServiceBuilder {
    return new OpenAiAudioToTextServiceBuilder()
  }

  getAudioContentAsync(
    text: string,
    executionSettings: TextToAudioExecutionSettings
  ): Observable<AudioContent> {
    const options = this.convertOptions(text, executionSettings)
    return from(this.getClient().audio.speech.create(options)).pipe(
      mergeMap((it) => it.arrayBuffer()),
      map(
        (bytes) =>
          new AudioContent(
            new File([new Blob([bytes])], executionSettings.getFileName()),
            this.getModelId()
          )
      )
    )
  }

  private convertOptions(
    text: string,
    executionSettings: TextToAudioExecutionSettings
  ): SpeechCreateParams {
    return {
      model: this.getModelId(),
      input: text,
      response_format: (executionSettings?.getResponseFormat() ??
        "mp3") as SpeechCreateParams["response_format"],
      voice: executionSettings.getVoice(),
      speed: executionSettings.getSpeed(),
    }
  }
}

export class OpenAiAudioToTextServiceBuilder {
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

  build(): OpenAiTextToAudioService {
    if (this.client == null) {
      throw new SKException("OpenAI client is required")
    }

    if (this.modelId == null) {
      throw new SKException("Model id is required")
    }

    if (this.deploymentName == null) {
      Logger.debug("Deployment name is not provided, using model id as deployment name")
      this.deploymentName = this.modelId
    }

    return new OpenAiTextToAudioService(this.client, this.modelId, this.deploymentName)
  }
}
