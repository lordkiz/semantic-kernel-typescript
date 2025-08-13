import { Kernel } from "@semantic-kernel-typescript/core"
import {
  AgentInvokeOptions,
  AgentResponseItem,
  AgentThread,
  KernelAgent,
} from "@semantic-kernel-typescript/core/agents"
import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { AutoFunctionChoiceBehavior } from "@semantic-kernel-typescript/core/functionchoice"
import { KernelArguments, PromptTemplate } from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  InvocationReturnMode,
} from "@semantic-kernel-typescript/core/orchestration"
import {
  AuthorRole,
  ChatCompletionService,
  ChatHistory,
  ChatMessageContent,
} from "@semantic-kernel-typescript/core/services"
import { map, mergeMap, Observable, throwError } from "rxjs"
import ChatHistoryAgentThread from "./ChatHistoryAgentThread"

export default class ChatCompletionAgent extends KernelAgent {
  constructor(
    id: string,
    name: string,
    description: string,
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    context?: InvocationContext,
    instructions?: string,
    template?: PromptTemplate
  ) {
    super(id, name, description, kernel, kernelArguments, context, instructions, template)
  }

  static Builder(): ChatCompletionAgentBuilder {
    return new ChatCompletionAgentBuilder()
  }

  override invokeAsync<T = any>(
    messages: ChatMessageContent<T>[],
    thread?: AgentThread,
    options?: AgentInvokeOptions
  ): Observable<AgentResponseItem<ChatMessageContent<T>>[]> {
    return this.ensureThreadExistsWithMessages(messages, ChatHistoryAgentThread, thread).pipe(
      map((chatHistoryAgentThread) => {
        const history = new ChatHistory(chatHistoryAgentThread.chatHistory.messages)

        return this.performInvokeAsync(history, chatHistoryAgentThread, options).pipe(
          map((chatMesageContents) => {
            return chatMesageContents.map(
              (message) => new AgentResponseItem(message, chatHistoryAgentThread)
            )
          })
        )
      }),
      mergeMap((it) => it)
    )
  }

  private performInvokeAsync(
    history: ChatHistory,
    thread: AgentThread,
    opts?: AgentInvokeOptions
  ): Observable<ChatMessageContent<any>[]> {
    let options = opts

    if (!options) {
      options = new AgentInvokeOptions()
    }

    const kernel = options.kernel ?? this.kernel
    const kernelArguments: KernelArguments = this.mergeArguments(options.kernelArguments)
    const additionalInstructions = options.additionalInstructions
    const invocationContext = options.invocationContext ?? this.invocationContext

    if (!invocationContext.serviceClass) {
      throw new SKException("No ServiceClass specified in the invocation context")
    }

    try {
      const chatCompletionService: ChatCompletionService = kernel.getService(
        invocationContext.serviceClass
      ) as ChatCompletionService

      const executionSettings =
        invocationContext.promptExecutionSettings ?? kernelArguments.executionSettings

      const invocationContextBuilder = InvocationContext.Builder()
        .withPromptExecutionSettings(executionSettings)
        .withReturnMode(InvocationReturnMode.NEW_MESSAGES_ONLY)

      if (invocationContext) {
        invocationContextBuilder
          .withTelemetry(invocationContext.telemetry)
          .withToolCallBehavior(invocationContext.toolCallBehavior)
          .withKernelHooks(invocationContext.kernelHooks)
        if (invocationContext.functionChoiceBehavior) {
          invocationContextBuilder.withFunctionChoiceBehavior(
            invocationContext.functionChoiceBehavior
          )
        }
      }

      const agentInvocationContext = invocationContextBuilder.build()

      return this.renderInstructionsAsync(kernel, kernelArguments, agentInvocationContext).pipe(
        map((functionResult) => functionResult.result),
        map((instructions) => {
          const chatHistory = new ChatHistory(instructions)
          if (additionalInstructions) {
            chatHistory.addSystemMessage(additionalInstructions)
          }

          chatHistory.addAll(history)

          // notify thread of the chat contents
          if (this.shouldNotifyFunctionCalls(agentInvocationContext)) {
            return chatCompletionService
              .getChatMessageContentsAsync(chatHistory, kernel, agentInvocationContext)
              .pipe(
                map((messages) => {
                  return messages
                    .map((message) => {
                      this.notifyThread(thread, message)
                      return message
                    })
                    .filter(
                      (message) => !!message.content && message.AuthorRole !== AuthorRole.TOOL
                    )
                })
              )
          }

          return chatCompletionService.getChatMessageContentsAsync(
            chatHistory,
            kernel,
            agentInvocationContext
          )
        }),
        mergeMap((it) => it)
      )
    } catch (e) {
      return throwError(() => e)
    }
  }

  shouldNotifyFunctionCalls(invocationContext: InvocationContext): boolean {
    if (invocationContext == null) {
      return false
    }

    if (
      invocationContext.functionChoiceBehavior &&
      invocationContext.functionChoiceBehavior instanceof AutoFunctionChoiceBehavior
    ) {
      return invocationContext.functionChoiceBehavior.isAutoInvoke()
    }

    if (invocationContext.toolCallBehavior) {
      return invocationContext.toolCallBehavior.isAutoInvokeAllowed()
    }

    return false
  }
}

class ChatCompletionAgentBuilder {
  private id: string | undefined
  private name: string | undefined
  private description: string | undefined
  private kernel: Kernel | undefined
  private kernelArguments?: KernelArguments | undefined
  private invocationContext?: InvocationContext | undefined
  private instructions?: string | undefined
  private template?: PromptTemplate | undefined

  /**
   * Set the ID of the agent.
   *
   * @param id The ID of the agent.
   */
  public withId(id: string) {
    this.id = id
    return this
  }

  /**
   * Set the name of the agent.
   *
   * @param name The name of the agent.
   */
  public withName(name: string) {
    this.name = name
    return this
  }

  /**
   * Set the description of the agent.
   *
   * @param description The description of the agent.
   */
  public withDescription(description: string) {
    this.description = description
    return this
  }

  /**
   * Set the kernel to use for the agent.
   *
   * @param kernel The kernel to use.
   */
  public withKernel(kernel: Kernel) {
    this.kernel = kernel
    return this
  }

  /**
   * Set the kernel arguments to use for the agent.
   *
   * @param KernelArguments The kernel arguments to use.
   */
  public withKernelArguments(kernelArguments: KernelArguments) {
    this.kernelArguments = kernelArguments
    return this
  }

  /**
   * Set the instructions for the agent.
   *
   * @param instructions The instructions for the agent.
   */
  public withInstructions(instructions: string) {
    this.instructions = instructions
    return this
  }

  /**
   * Set the invocation context for the agent.
   *
   * @param invocationContext The invocation context to use.
   */
  public withInvocationContext(invocationContext: InvocationContext) {
    this.invocationContext = invocationContext
    return this
  }

  /**
   * Set the template for the agent.
   *
   * @param template The template to use.
   */
  public withTemplate(template: PromptTemplate) {
    this.template = template
    return this
  }

  /**
   * Build the ChatCompletionAgent instance.
   *
   * @return The ChatCompletionAgent instance.
   */
  public build(): ChatCompletionAgent {
    if (!this.id) {
      throw new SKException("id is required to build a ChatCompletionAgent")
    }
    if (!this.name) {
      throw new SKException("name is required to build a ChatCompletionAgent")
    }

    if (!this.description) {
      throw new SKException("name is required to build a ChatCompletionAgent")
    }

    if (!this.kernel) {
      throw new SKException("kernel is required to build a ChatCompletionAgent")
    }
    return new ChatCompletionAgent(
      this.id,
      this.name,
      this.description,
      this.kernel,
      this.kernelArguments,
      this.invocationContext,
      this.instructions,
      this.template
    )
  }
}
