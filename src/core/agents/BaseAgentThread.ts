import { ChatMessageContent } from "../services"
import { AgentThread } from "./types/AgentThread"

export abstract class BaseAgentThread implements AgentThread {
  protected _id: string
  protected _isDeleted: boolean = false

  constructor(id: string) {
    this._id = id
  }

  get id(): string {
    throw new Error("Method not implemented.")
  }
  create(): AgentThread {
    throw new Error("Method not implemented.")
  }
  delete(): boolean {
    this._isDeleted = true
    return true
  }
  get isDeleted(): boolean {
    return this._isDeleted
  }
  copy(): AgentThread {
    throw new Error("Method not implemented.")
  }
  onNewMessage(_newMessage: ChatMessageContent<any>): void {
    throw new Error("Method not implemented.")
  }
}
