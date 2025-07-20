export default class ChatMessages<MessageType, ContentType> {
  private newMessages: MessageType[]
  private allMessages: MessageType[]
  private newChatMessageContent: ContentType[]

  constructor(
    allMessages: MessageType[],
    newMessages?: MessageType[],
    newChatMessageContent?: ContentType[]
  ) {
    this.allMessages = Object.seal(allMessages)
    this.newMessages = Object.seal(newMessages ?? [])
    this.newChatMessageContent = Object.seal(newChatMessageContent ?? [])
  }

  addAll(requestMessages: MessageType[]): ChatMessages<MessageType, ContentType> {
    const tmpAllMessages = [...this.allMessages, ...requestMessages]
    const tmpNewMessages = [...this.newMessages, ...requestMessages]
    return new ChatMessages<MessageType, ContentType>(
      tmpAllMessages,
      tmpNewMessages,
      this.newChatMessageContent
    )
  }

  add(requestMessage: MessageType) {
    return this.addAll([requestMessage])
  }

  addChatMessage(chatMessageContent: ContentType[]) {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  assertCommonHistory(messages: MessageType[]): boolean {
    throw new Error("Implement in subclass")
  }
}
