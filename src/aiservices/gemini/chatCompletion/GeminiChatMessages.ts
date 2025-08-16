import { Content, createPartFromFunctionResponse } from "@google/genai"
import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { ChatMessages } from "@semantic-kernel-typescript/core/orchestration"
import {
  AuthorRole,
  ChatHistory,
  ChatMessageContent,
} from "@semantic-kernel-typescript/core/services"
import { GeminiChatMessageContent } from "./GeminiChatMessageContent"
import { GeminiFunctionCallContent } from "./GeminiFunctionCallContent"

export class GeminiChatMessages extends ChatMessages<Content, GeminiChatMessageContent<any>> {
  static fromChatHistory(chatHistory: ChatHistory) {
    const chatCompletiontMessageContents = GeminiChatMessages.getChatCompletionMessageContents(
      chatHistory.messages
    )

    return new GeminiChatMessages(chatCompletiontMessageContents)
  }

  private static getChatCompletionMessageContents(messages: ChatMessageContent<any>[]) {
    const contents: Content[] = []

    messages.forEach((chatMessageContent) => {
      const content: Content = { role: AuthorRole.USER }

      if (chatMessageContent.AuthorRole === AuthorRole.ASSISTANT) {
        content.role = AuthorRole.MODEL
        const isAFunctionCall = Boolean(chatMessageContent.items?.length)
        if (isAFunctionCall) {
          ;((chatMessageContent.items ?? []) as GeminiFunctionCallContent[]).forEach(
            (geminiFunctionCall) => {
              content.parts = [
                ...(content.parts ?? []),
                { functionCall: geminiFunctionCall.functionCall },
              ]
            }
          )
        } else {
          content.parts = [...(content.parts ?? []), { text: chatMessageContent.content }]
        }
      } else if (chatMessageContent.AuthorRole === AuthorRole.TOOL) {
        content.role = AuthorRole.USER

        const fns = GeminiFunctionCallContent.getFunctionTools(chatMessageContent)

        fns.forEach((geminiFunctionCall) => {
          const functionResult = geminiFunctionCall.functionResult

          if (!functionResult || !functionResult?.result) {
            throw new SKException("Gemini failed to return a result")
          }

          if (!geminiFunctionCall.id) {
            throw new SKException(`No id found on gemini function ${geminiFunctionCall.fullName}`)
          }

          const part = createPartFromFunctionResponse(
            geminiFunctionCall.id,
            geminiFunctionCall.fullName,
            { result: functionResult.result }
          )

          content.parts = [...(content.parts ?? []), part]
        })
      } else {
        content.parts = [...(content.parts ?? []), { text: chatMessageContent.content }]
      }

      contents.push(content)
    })

    return contents
  }

  /**
   * Checks that the two messages have a similar history
   *
   * @param messages The messages to merge in
   * @return The merged chat messages
   */

  override assertCommonHistory(_messages: Content[]): boolean {
    return true
  }
}
