import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import { ChatMessages } from "@semantic-kernel-typescript/core/orchestration"
import _ from "lodash"
import { ChatCompletionMessageParam, CompletionUsage } from "openai/resources"
import OpenAIChatMessageContent from "./OpenAIChatMessageContent"

export type ChatCompletionMessageParamWithCompletionUsage = ChatCompletionMessageParam & {
  usage?: CompletionUsage
}

export default class OpenAIChatMessages extends ChatMessages<
  ChatCompletionMessageParamWithCompletionUsage,
  OpenAIChatMessageContent<any>
> {
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
