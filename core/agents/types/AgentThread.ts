import { Observable } from "rxjs"
import { ChatMessageContent } from "../../services"

type ThreadId = string

export interface AgentThread {
  /** The thread Id */
  get id(): ThreadId

  /** Create a new thread
   * @returns Observable<string>
   */
  createAsync(): Observable<ThreadId>

  /** Delete the thread */
  delete(): boolean

  /** Check if thread is deleted */
  get isDeleted(): boolean

  /** Create a copy of the thread */
  copy(): AgentThread

  /** Handle new message on thread */
  onNewMessage(newMessage: ChatMessageContent<any>): void
}
