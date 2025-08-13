import { BaseAgentThread } from "@semantic-kernel-typescript/core/agents"
import { ChatHistory, ChatMessageContent } from "@semantic-kernel-typescript/core/services"
import { of } from "rxjs"
import { v4 as uuid4 } from "uuid"

export default class ChatHistoryAgentThread extends BaseAgentThread {
  private _chatHistory: ChatHistory
  constructor(id: string, chatHistory?: ChatHistory) {
    super(id)
    this._chatHistory = chatHistory ?? new ChatHistory()
  }

  get chatHistory() {
    return this._chatHistory
  }

  override createAsync() {
    if (!this.id) {
      this._id = uuid4()
      this._chatHistory = new ChatHistory()
    }
    return of(this.id)
  }

  override delete(): boolean {
    this._chatHistory.clear()
    this._isDeleted = true
    return this._isDeleted
  }

  /**
   * Create a copy of the thread.
   *
   * @return A new instance of the thread.
   */
  override copy(): ChatHistoryAgentThread {
    return new ChatHistoryAgentThread(this.id, new ChatHistory(this._chatHistory.messages))
  }

  override onNewMessage(newMessage: ChatMessageContent<any>): void {
    this._chatHistory.addMessage(newMessage)
  }
}
