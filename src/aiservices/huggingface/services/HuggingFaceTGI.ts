import { Kernel } from "@semantic-kernel-typescript/core"
import { AIServiceBuilder } from "@semantic-kernel-typescript/core/builders"
import { AIException } from "@semantic-kernel-typescript/core/exceptions"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import {
  ChatCompletionService,
  ChatHistory,
  ChatMessageContent,
  StreamingChatContent,
} from "@semantic-kernel-typescript/core/services"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"
import { Observable } from "rxjs"
import HuggingFaceClient from "../HuggingFaceClient"
import HuggingFaceService from "../HuggingFaceService"

export default class HuggingFaceTGI
  extends HuggingFaceService<OpenAI>
  implements ChatCompletionService
{
  private implementationClass: OpenAIChatCompletion

  constructor(client: OpenAI, modelId: string, deploymentName?: string, serviceId?: string) {
    super(client, modelId, deploymentName ?? "", serviceId)

    this.implementationClass = new OpenAIChatCompletion(
      this.client,
      this.modelId,
      this.deploymentName,
      this.serviceId
    )
  }

  static Builder() {
    return new HuggingFaceTGIBuilder()
  }

  getChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel: Kernel,
    invocationContext?: InvocationContext<any>
  ): Observable<ChatMessageContent<string>[]> {
    return this.implementationClass.getChatMessageContentsAsync(
      promptOrChatHistory,
      kernel,
      invocationContext
    )
  }

  getStreamingChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel: Kernel,
    invocationContext?: InvocationContext<any>
  ): Observable<StreamingChatContent<any>> {
    return this.implementationClass.getStreamingChatMessageContentsAsync(
      promptOrChatHistory,
      kernel,
      invocationContext
    )
  }
}

/**
 * Builder for creating a new instance of {@link HuggingFaceTGI}.
 */
class HuggingFaceTGIBuilder extends AIServiceBuilder<
  HuggingFaceClient,
  HuggingFaceTGI,
  HuggingFaceTGIBuilder
> {
  public build(): HuggingFaceTGI {
    if (!this.client || !this.modelId) {
      throw new AIException(AIException.ErrorCodes.INVALID_REQUEST)
    }

    if (!this.deploymentName) {
      Logger.debug("Deployment name is not provided, using model id as deployment name")
      this.deploymentName = this.modelId
    }

    return new HuggingFaceTGI(this.client, this.deploymentName, this.modelId, this.serviceId)
  }
}
