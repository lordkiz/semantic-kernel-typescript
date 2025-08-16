import { last, map, Observable, of, switchMap } from "rxjs"
import { v4 as uuid4 } from "uuid"
import { Kernel } from "../Kernel"
import { KernelArguments, PromptTemplate } from "../functions"
import { Logger } from "../log/Logger"
import { FunctionResult, InvocationContext, PromptExecutionSettings } from "../orchestration"
import { ChatMessageContent } from "../services"
import { AgentInvokeOptions } from "./AgentInvokeOptions"
import { AgentResponseItem } from "./AgentResponseItem"
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

  get invocationContext() {
    return this._invocationContext
  }

  get kernel(): Kernel {
    return this._kernel
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

  mergeArguments(anotherKernelArguments?: KernelArguments) {
    if (!anotherKernelArguments) {
      return this.kernelArguments
    }

    const executionSettings = new PromptExecutionSettings(
      Object.assign(
        this.kernelArguments.getExecutionSettings().toObject(),
        anotherKernelArguments.getExecutionSettings().toObject()
      )
    )

    return KernelArguments.Builder()
      .withVariables(this.kernelArguments)
      .withVariables(anotherKernelArguments)
      .withExecutionSettings(executionSettings)
      .build()
  }

  renderInstructionsAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): Observable<FunctionResult<string>> {
    if (this.template) {
      return this.template.renderAsync(kernel, kernelArguments, invocationContext)
    } else {
      if (!this.instructions) {
        Logger.warn("No template or instructions provided to KernelAgent. Returning empty string")
      }
      return of(new FunctionResult(this.instructions || ""))
    }
  }

  ensureThreadExistsWithMessages<T extends AgentThread>(
    messages: ChatMessageContent<any>[],
    AgentThreadClass: new (...args: any[]) => T,
    thread?: AgentThread
  ): Observable<T> {
    const newThread: T = (
      thread && !thread.isDeleted ? thread.copy() : new AgentThreadClass(uuid4())
    ) as T

    return newThread.createAsync().pipe(
      switchMap(() => messages),
      map((message) => {
        this.notifyThread(newThread, message)
      }),
      switchMap(() => of(newThread)),
      last()
    )
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
