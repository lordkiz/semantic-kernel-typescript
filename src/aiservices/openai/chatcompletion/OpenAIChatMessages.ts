import _ from "lodash"
import { ChatCompletionMessageParam } from "openai/resources"
import { Logger } from "../../../semantickernel/log/Logger"
import ChatMessages from "../../../semantickernel/orchestration/ChatMessages"
import OpenAIChatMessageContent from "./OpenAIChatMessageContent"

export default class OpenAIChatMessages extends ChatMessages<
  ChatCompletionMessageParam,
  OpenAIChatMessageContent<any>
> {
  private LOGGER = Logger

  /**
   * Checks that the two messages have a similar history
   *
   * @param messages The messages to merge in
   * @return The merged chat messages
   */
  override assertCommonHistory(messages: ChatCompletionMessageParam[]): boolean {
    let index = 0
    while (index < messages.length && index < this.getAllMessages().length) {
      const a = messages[index]
      const b = this.getAllMessages()[index]

      let matches = false

      if (a.role === b.role) {
        matches = _.isEqual(a.content, b.content)
      }
      if (!matches) {
        this.LOGGER.warn(
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
