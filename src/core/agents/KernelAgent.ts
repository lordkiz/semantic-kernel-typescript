import { Observable, of } from "rxjs"
import { v4 as uuid4 } from "uuid"
import Kernel from "../Kernel"
import { KernelArguments, PromptTemplate } from "../functions"
import { Logger } from "../log/Logger"
import { FunctionResult, InvocationContext } from "../orchestration"
import { ChatMessageContent } from "../services"
import AgentInvokeOptions from "./AgentInvokeOptions"
import AgentResponseItem from "./AgentResponseItem"
import { Agent } from "./types/Agent"
import { AgentThread } from "./types/AgentThread"

export abstract class KernelAgent implements Agent {
  private _id: string
  private _name: string
  private _description: string
  private _kernel: Kernel
  private _kernelArguments: KernelArguments
  private _invocationContext: InvocationContext
  private _instructions: string | undefined
  private _template: PromptTemplate | undefined

  constructor(
    id: string,
    name: string,
    description: string,
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext,
    instructions?: string,
    template?: PromptTemplate
  ) {
    this._id = id || uuid4()
    this._name = name
    this._description = description
    this._kernel = kernel
    this._kernelArguments = kernelArguments?.copy() ?? KernelArguments.Builder().build()
    this._invocationContext = invocationContext ?? InvocationContext.Builder().build()
    this._instructions = instructions
    this._template = template
  }

  get id(): string {
    return this._id
  }
  get name(): string {
    return this._name
  }
  get description(): string {
    return this._description
  }

  get kernelArguments() {
    return this._kernelArguments
  }

  get instructions() {
    return this._instructions
  }

  get template() {
    return this._template
  }

  renderInstructionsAsync(): Observable<FunctionResult<string>> {
    if (this.template) {
      return this.template.renderAsync(this._kernel, this.kernelArguments, this._invocationContext)
    } else {
      if (!this.instructions) {
        Logger.warn("No template or instructions provided to KernelAgent. Returning empty string")
      }
      return of(new FunctionResult(this.instructions || ""))
    }
  }

  ensureThreadExistsWithMessages<T extends AgentThread>(
    messages: ChatMessageContent<any>[],
    thread: AgentThread
  ): T {
    const newThread = !thread.isDeleted ? thread.copy() : thread.create()

    messages.forEach((chatMessageContent) => {
      newThread.onNewMessage(chatMessageContent)
    })

    return newThread as T
  }

  invokeAsync<T = any>(
    _messages: ChatMessageContent<T>[],
    _thread: AgentThread,
    _options: AgentInvokeOptions
  ): Observable<AgentResponseItem<ChatMessageContent<T>>[]> {
    throw new Error("Method not implemented. Override in subclass")
  }

  notifyThread(thread: AgentThread, newMessage: ChatMessageContent<any>): void {
    thread.onNewMessage(newMessage)
  }
}
