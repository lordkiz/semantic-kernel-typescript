import _ from "lodash"
import { ChatCompletionMessageParam } from "openai/resources"
import { Logger } from "../../../semantickernel/log/Logger"
import OpenAIChatMessageContent from "./OpenAIChatMessageContent"

export default class ChatMessages {
  private LOGGER = Logger
  private newMessages: ChatCompletionMessageParam[]
  private allMessages: ChatCompletionMessageParam[]
  private newChatMessageContent: OpenAIChatMessageContent<any>[]

  constructor(
    allMessages: ChatCompletionMessageParam[],
    newMessages?: ChatCompletionMessageParam[],
    newChatMessageContent?: OpenAIChatMessageContent<any>[]
  ) {
    this.allMessages = Object.seal(allMessages)
    this.newMessages = Object.seal(newMessages ?? [])
    this.newChatMessageContent = Object.seal(newChatMessageContent ?? [])
  }

  addAll(requestMessages: ChatCompletionMessageParam[]): ChatMessages {
    const tmpAllMessages = [...this.allMessages, ...requestMessages]
    const tmpNewMessages = [...this.newMessages, ...requestMessages]
    return new ChatMessages(tmpAllMessages, tmpNewMessages, this.newChatMessageContent)
  }

  add(requestMessage: ChatCompletionMessageParam) {
    return this.addAll([requestMessage])
  }

  addChatMessage(chatMessageContent: OpenAIChatMessageContent<any>[]) {
    const tmpChatMessageContent = [...this.newChatMessageContent, ...chatMessageContent]
    return new ChatMessages(this.allMessages, this.newMessages, tmpChatMessageContent)
  }

  getAllMessages() {
    return this.allMessages
  }

  getNewMessages() {
    return this.newMessages
  }

  getNewChatMessageContent() {
    return this.newChatMessageContent
  }

  /**
   * Checks that the two messages have a similar history
   *
   * @param messages The messages to merge in
   * @return The merged chat messages
   */
  assertCommonHistory(messages: ChatCompletionMessageParam[]): boolean {
    let index = 0
    while (index < messages.length && index < this.allMessages.length) {
      const a = messages[index]
      const b = this.allMessages[index]

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
