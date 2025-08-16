import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import {
  AudioContent,
  AudioToTextExecutionSettings,
} from "@semantic-kernel-typescript/core/services/audio"
import { AudioToTextService } from "@semantic-kernel-typescript/core/services/audio/types/AudioToTextService"
import OpenAI from "openai"
import { TranscriptionCreateParamsNonStreaming } from "openai/resources/audio"
import { from, map, Observable } from "rxjs"
import { OpenAIService } from "../OpenAIService"

export class OpenAIAudioToTextService extends OpenAIService<OpenAI> implements AudioToTextService {
  constructor(client: OpenAI, modelId: string, deploymentName: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder(): OpenAiAudioToTextServiceBuilder {
    return new OpenAiAudioToTextServiceBuilder()
  }

  getTextContentsAsync(
    content: AudioContent,
    executionSettings: AudioToTextExecutionSettings<TranscriptionCreateParamsNonStreaming>
  ): Observable<string> {
    const options = this.convertOptions(content, executionSettings)
    return from(this.client.audio.transcriptions.create(options)).pipe(map((it) => it.text))
  }

  private convertOptions(
    content: AudioContent,
    executionSettings: AudioToTextExecutionSettings<TranscriptionCreateParamsNonStreaming>
  ): TranscriptionCreateParamsNonStreaming {
    const { model, file, ...rest } = executionSettings.toObject()
    return {
      model: model ?? this.modelId,
      file: file ?? content.data,
      ...rest,
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

  build(): OpenAIAudioToTextService {
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

    return new OpenAIAudioToTextService(this.client, this.modelId, this.deploymentName)
  }
}
