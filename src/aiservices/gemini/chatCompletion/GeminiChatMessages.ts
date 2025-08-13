import { GenerateContentResponse } from "@google/genai"
import ChatMessages from "@semantic-kernel-typescript/core/orchestration/ChatMessages"
import GeminiChatMessageContent from "./GeminiChatMessageContent"

export default class GeminiChatMessages extends ChatMessages<
  GenerateContentResponse,
  GeminiChatMessageContent<any>
> {
  /**
   * Checks that the two messages have a similar history
   *
   * @param messages The messages to merge in
   * @return The merged chat messages
   */

  override assertCommonHistory(_messages: GenerateContentResponse[]): boolean {
    return true
  }
}
