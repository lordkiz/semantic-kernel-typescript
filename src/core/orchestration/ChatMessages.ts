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
    this.allMessages = tmpAllMessages
    this.newMessages = tmpNewMessages
    return this
  }

  add(requestMessage: MessageType) {
    return this.addAll([requestMessage])
  }

  addChatMessage(chatMessageContent: ContentType[]) {
    const tmpChatMessageContent = [...this.newChatMessageContent, ...chatMessageContent]
    this.newChatMessageContent = tmpChatMessageContent

    return this
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

  /**
   * maps messageType to contenttype
   *
   * @param messages The messages to map
   * @return ContentType[]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapToContentType(messages: MessageType[]): ContentType[] {
    throw new Error("Implement in subclass")
  }

  /**
   * maps MessageType to ContentType
   *
   * @param contents The contents to map
   * @return MessageType[]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mapToMessageType(contents: ContentType[]): MessageType[] {
    throw new Error("Implement in subclass")
  }
}
