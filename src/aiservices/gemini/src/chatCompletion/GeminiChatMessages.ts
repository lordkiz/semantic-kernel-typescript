import { GenerateContentResponse } from "@google/genai"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import ChatMessages from "@semantic-kernel-typescript/core/orchestration/ChatMessages"
import GeminiChatMessageContent from "./GeminiChatMessageContent"

export default class GeminiChatMessages extends ChatMessages<
  GenerateContentResponse,
  GeminiChatMessageContent<any>
> {
  private LOGGER = Logger

  /**
   * Checks that the two messages have a similar history
   *
   * @param messages The messages to merge in
   * @return The merged chat messages
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override assertCommonHistory(_messages: GenerateContentResponse[]): boolean {
    return true
  }
}
