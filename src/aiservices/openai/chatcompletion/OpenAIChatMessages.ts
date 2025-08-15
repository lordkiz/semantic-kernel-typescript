import { FunctionCallContent } from "@semantic-kernel-typescript/core/contents"
import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import { ChatMessages, ToolCallBehavior } from "@semantic-kernel-typescript/core/orchestration"
import {
  AuthorRole,
  ChatHistory,
  ChatMessageContent,
  ChatMessageContentType,
  ChatMessageImageContent,
} from "@semantic-kernel-typescript/core/services"
import _ from "lodash"
import {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionSystemMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
  CompletionUsage,
} from "openai/resources"
import OpenAIChatMessageContent from "./OpenAIChatMessageContent"

export type ChatCompletionMessageParamWithCompletionUsage = ChatCompletionMessageParam & {
  usage?: CompletionUsage
}

export default class OpenAIChatMessages extends ChatMessages<
  ChatCompletionMessageParamWithCompletionUsage,
  OpenAIChatMessageContent<any>
> {
  static fromChatHistory(chatHistory: ChatHistory) {
    const chatCompletiontMessageParams = OpenAIChatMessages.getChatCompletionMessageParams(
      chatHistory.messages
    )

    return new OpenAIChatMessages(chatCompletiontMessageParams)
  }

  private static getChatCompletionMessageParams(messages: ChatMessageContent<any>[]) {
    return messages.map((c) => OpenAIChatMessages.getChatCompletionMessageParam(c))
  }

  private static getChatCompletionMessageParam(
    message: ChatMessageContent<any>
  ): ChatCompletionMessageParam {
    const authorRole = message.AuthorRole
    const content = message.content

    if (message.contentType === ChatMessageContentType.IMAGE_URL && content) {
      return OpenAIChatMessages.formImageMessage(message, content)
    }

    switch (authorRole) {
      case AuthorRole.ASSISTANT:
        return OpenAIChatMessages.formAssistantMessage(message, content)
      case AuthorRole.SYSTEM: {
        const chatCompletionSystemMessageParam: ChatCompletionSystemMessageParam = {
          role: "system",
          content,
        }
        return chatCompletionSystemMessageParam
      }
      case AuthorRole.USER: {
        const chatCompletionUserMessageParam: ChatCompletionUserMessageParam = {
          role: "user",
          content,
        }
        return chatCompletionUserMessageParam
      }
      case AuthorRole.TOOL: {
        const id = message.getMetadata()?.id
        if (!id) {
          throw new SKException(
            "Require to create a tool call message, but no tool call id is available"
          )
        }
        const chatCompletionToolMessageParam: ChatCompletionToolMessageParam = {
          role: "tool",
          content,
          tool_call_id: id,
        }
        return chatCompletionToolMessageParam
      }
      default:
        Logger.debug(`Unexpected author role: ${authorRole}`)
        throw new SKException("Unexpected author role: " + authorRole)
    }
  }

  static formAssistantMessage(
    message: ChatMessageContent<any>,
    content?: string
  ): ChatCompletionAssistantMessageParam {
    const assistantMessage: ChatCompletionAssistantMessageParam = { role: "assistant", content }
    const toolCalls = FunctionCallContent.getFunctionTools(message)

    if (toolCalls?.length) {
      assistantMessage.tool_calls = toolCalls.map((toolCall) => {
        const kernelArguments = toolCall.kernelArguments
        const args =
          kernelArguments && kernelArguments.size > 0
            ? JSON.stringify(
                Object.keys(kernelArguments).reduce(
                  (acc, key) => {
                    acc[key] = kernelArguments.get(key)?.value
                    return acc
                  },
                  {} as Record<string, any>
                )
              )
            : "{}"

        let prefix = ""
        if (toolCall.pluginName) {
          prefix = toolCall.pluginName + ToolCallBehavior.FUNCTION_NAME_SEPARATOR
        }

        const name = prefix + toolCall.functionName
        const fn = {
          name,
          arguments: args,
        }
        const functionToolCall: ChatCompletionMessageToolCall = {
          id: toolCall.id!,
          function: fn,
          type: "function",
        }
        return functionToolCall
      })
    }

    return assistantMessage
  }

  static formImageMessage(
    message: ChatMessageContent<any>,
    content: string
  ): ChatCompletionUserMessageParam {
    const imageUrl: ChatCompletionContentPartImage.ImageURL = {
      url: content,
      detail: (message as ChatMessageImageContent<any>)
        .getDetail()
        ?.toLowerCase() as ChatCompletionContentPartImage.ImageURL["detail"],
    }

    return {
      content: [
        {
          image_url: imageUrl,
          type: "image_url",
        },
      ],
      role: "user",
    }
  }

  /**
   * Checks that the two messages have a similar history
   *
   * @param messages The messages to merge in
   * @return The merged chat messages
   */
  override assertCommonHistory(messages: ChatCompletionMessageParam[]): boolean {
    let index = 0
    while (index < messages.length && index < this.allMessages.length) {
      const a = messages[index]
      const b = this.allMessages[index]

      let matches = false

      if (a.role === b.role) {
        matches = _.isEqual(a.content, b.content)
      }
      if (!matches) {
        Logger.warn(
          "Messages do not match at index: " +
            index +
            " you might be merging unrelated message histories"
        )
        return false
      }
      index++
    }

    return true
  }
}
