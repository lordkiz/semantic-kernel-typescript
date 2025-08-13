export default class ChatMessages<MessageType, ContentType> {
  private _newMessages: MessageType[]
  private _allMessages: MessageType[]
  private _newChatMessageContent: ContentType[]

  constructor(
    allMessages: MessageType[],
    newMessages?: MessageType[],
    newChatMessageContent?: ContentType[]
  ) {
    this._allMessages = Object.seal(allMessages)
    this._newMessages = Object.seal(newMessages ?? [])
    this._newChatMessageContent = Object.seal(newChatMessageContent ?? [])
  }

  addAll(requestMessages: MessageType[]): ChatMessages<MessageType, ContentType> {
    const tmpAllMessages = [...this._allMessages, ...requestMessages]
    const tmpNewMessages = [...this._newMessages, ...requestMessages]
    this._allMessages = tmpAllMessages
    this._newMessages = tmpNewMessages
    return this
  }

  add(requestMessage: MessageType) {
    return this.addAll([requestMessage])
  }

  addChatMessage(chatMessageContent: ContentType[]) {
    const tmpChatMessageContent = [...this._newChatMessageContent, ...chatMessageContent]
    this._newChatMessageContent = tmpChatMessageContent

    return this
  }

  get allMessages() {
    return this._allMessages
  }

  get newMessages() {
    return this._newMessages
  }

  get newChatMessageContent() {
    return this._newChatMessageContent
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
