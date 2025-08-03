import { AgentThread } from "./types/AgentThread"

export default class AgentResponseItem<T> {
  private _message: T
  private _thread: AgentThread

  constructor(message: T, thread: AgentThread) {
    this._message = message
    this._thread = thread
  }

  get message(): T {
    return this._message
  }

  get thread(): AgentThread {
    return this._thread
  }
}
