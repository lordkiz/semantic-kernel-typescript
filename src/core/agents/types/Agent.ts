import { Observable } from "rxjs"
import { ChatMessageContent } from "../../services"
import AgentInvokeOptions from "../AgentInvokeOptions"
import AgentResponseItem from "../AgentResponseItem"
import { AgentThread } from "./AgentThread"

export interface Agent {
  /** The Agent's Id */
  get id(): string

  /** The Agent's name */
  get name(): string

  /** The Agent's description */
  get description(): string

  invokeAsync<T = any>(
    messages: ChatMessageContent<T>[],
    thread: AgentThread,
    options: AgentInvokeOptions
  ): Observable<AgentResponseItem<ChatMessageContent<T>>[]>

  notifyThread(thread: AgentThread, newMessage: ChatMessageContent<any>): void
}
