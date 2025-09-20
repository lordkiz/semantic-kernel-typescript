import { Kernel } from "@semantic-kernel-typescript/core"
import { AIServiceBuilder } from "@semantic-kernel-typescript/core/builders"
import { FunctionCallContent } from "@semantic-kernel-typescript/core/contents"
import { AIException, SKException } from "@semantic-kernel-typescript/core/exceptions"
import {
  AutoFunctionChoiceBehavior,
  FunctionChoiceBehavior,
  NoneFunctionChoiceBehavior,
  RequiredFunctionChoiceBehavior,
} from "@semantic-kernel-typescript/core/functionchoice"
import { KernelArguments } from "@semantic-kernel-typescript/core/functions"
import { PostChatCompletionEvent } from "@semantic-kernel-typescript/core/hooks"
import { PreToolCallEvent } from "@semantic-kernel-typescript/core/hooks/PreToolCallEvent"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import {
  FunctionResult,
  FunctionResultMetadata,
  InvocationContext,
  InvocationReturnMode,
  ToolCallBehavior,
} from "@semantic-kernel-typescript/core/orchestration"
import {
  AllowedKernelFunctions,
  RequiredKernelFunction,
} from "@semantic-kernel-typescript/core/orchestration/ToolCallBehavior"
import {
  AuthorRole,
  ChatCompletionService,
  ChatCompletionUtils,
  ChatHistory,
  ChatMessageContent,
  StreamingChatContent,
  TextAIService,
} from "@semantic-kernel-typescript/core/services"
import { authorRoleFromString } from "@semantic-kernel-typescript/core/services/chatcompletion/AuthorRole"
import OpenAI from "openai"
import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
  ChatCompletionToolMessageParam,
  CompletionUsage,
} from "openai/resources"
import { catchError, from, map, mergeMap, Observable, of, reduce, throwError } from "rxjs"
import { v4 as uuid4 } from "uuid"
import { OpenAIService } from "../OpenAIService"
import { FunctionInvocationError } from "./FunctionInvocationError"
import { OpenAIChatMessageContent } from "./OpenAIChatMessageContent"
import {
  ChatCompletionMessageParamWithCompletionUsage,
  OpenAIChatMessages,
} from "./OpenAIChatMessages"
import { OpenAIFunction } from "./OpenAIFunction"
import { OpenAIStreamingChatMessageContent } from "./OpenAIStreamingChatMessageContent"
import { OpenAIToolCallConfig } from "./OpenAIToolCallConfig"
import { OpenAIToolChoice } from "./OpenAIToolChoice"
import { OpenAIXMLPromptParser } from "./OpenAIXMLPromptParser"

export class OpenAIChatCompletion extends OpenAIService<OpenAI> implements ChatCompletionService {
  constructor(client: OpenAI, modelId: string, deploymentName: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder(): OpenAIChatCompletionBuilder {
    return new OpenAIChatCompletionBuilder()
  }

  private static getToolCallConfig(
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    fns: OpenAIFunction[],
    chatRequestMessages: ChatCompletionMessageParam[],
    requestIndex: number
  ): OpenAIToolCallConfig | undefined {
    if (!fns.length) {
      return
    }

    if (!invocationContext.functionChoiceBehavior && !invocationContext.toolCallBehavior) {
      return
    }

    if (invocationContext.functionChoiceBehavior) {
      return OpenAIChatCompletion.getFunctionChoiceBehaviorConfig(
        invocationContext.functionChoiceBehavior,
        fns,
        requestIndex
      )
    }
    return OpenAIChatCompletion.getToolCallBehaviorConfig(
      invocationContext.toolCallBehavior ?? new ToolCallBehavior(),
      fns,
      chatRequestMessages,
      requestIndex
    )
  }

  private static getFunctionChoiceBehaviorConfig(
    functionChoiceBehavior: FunctionChoiceBehavior,
    fns: OpenAIFunction[],
    requestIndex: number
  ): OpenAIToolCallConfig | undefined {
    if (!fns?.length) {
      return
    }

    let toolChoice: ChatCompletionToolChoiceOption
    let autoInvoke: boolean

    if (functionChoiceBehavior instanceof RequiredFunctionChoiceBehavior) {
      if (requestIndex >= 1) {
        return
      }
      autoInvoke = functionChoiceBehavior.isAutoInvoke()
      toolChoice = OpenAIToolChoice.Option.REQUIRED
    } else if (functionChoiceBehavior instanceof AutoFunctionChoiceBehavior) {
      toolChoice = OpenAIToolChoice.Option.AUTO
      autoInvoke =
        functionChoiceBehavior.isAutoInvoke() &&
        requestIndex < TextAIService.MAXIMUM_INFLIGHT_AUTO_INVOKES
    } else if (functionChoiceBehavior instanceof NoneFunctionChoiceBehavior) {
      toolChoice = OpenAIToolChoice.Option.NONE
      autoInvoke = false
    } else {
      throw new SKException("Unsupported function choice behavior: " + functionChoiceBehavior)
    }

    let allowedPluginFunctions = fns

    if (functionChoiceBehavior.functions?.length) {
      // if you specified list of functions to allow, then only those will be allowed
      allowedPluginFunctions = allowedPluginFunctions.filter((fn) =>
        functionChoiceBehavior.isFunctionAllowed(fn.pluginName, fn.name)
      )
    }

    const toolDefinitions: ChatCompletionTool[] = allowedPluginFunctions
      .map((fn) => fn.functionDefinition)
      .map((def) => ({ type: "function", function: def }))

    return {
      tools: toolDefinitions,
      toolChoice,
      autoInvoke,
      options: functionChoiceBehavior.options,
    }
  }

  private static getToolCallBehaviorConfig(
    toolCallBehavior: ToolCallBehavior,
    fns: OpenAIFunction[],
    chatRequestMessages: ChatCompletionMessageParam[],
    requestIndex: number
  ): OpenAIToolCallConfig | undefined {
    if (!fns.length) {
      return
    }

    let toolDefinitions: ChatCompletionTool[]
    let toolChoice: ChatCompletionToolChoiceOption

    if (toolCallBehavior instanceof RequiredKernelFunction) {
      const requiredFunction = toolCallBehavior.getRequiredFunction()
      const toolChoiceName = `${requiredFunction.getPluginName()}-${requiredFunction.getName()}`

      const hasBeenExecuted = OpenAIChatCompletion.hasToolCallBeenExecuted(
        chatRequestMessages,
        toolChoiceName
      )
      if (hasBeenExecuted) {
        return
      }

      const fnDefinition = OpenAIFunction.toFunctionDefinition(
        requiredFunction.getMetadata(),
        requiredFunction.getPluginName()
      )

      toolDefinitions = []
      toolDefinitions.push({ type: "function", function: fnDefinition })

      toolChoice = OpenAIToolChoice.toForcedFunction(
        requiredFunction.getPluginName(),
        requiredFunction.getName()
      )
    } else {
      toolChoice = OpenAIToolChoice.Option.AUTO

      const enabledKernelFunctions: AllowedKernelFunctions =
        toolCallBehavior as AllowedKernelFunctions

      toolDefinitions = fns
        .filter(
          (fn) =>
            enabledKernelFunctions.isAllKernelFunctionsAllowed() ??
            enabledKernelFunctions.isFunctionAllowed(fn.pluginName, fn.name)
        )
        .map((fn) => fn.functionDefinition)
        .map((def) => ({ type: "function", function: def }))

      if (!toolDefinitions.length) {
        return
      }
    }

    return {
      tools: toolDefinitions,
      toolChoice,
      autoInvoke:
        toolCallBehavior.isAutoInvokeAllowed() &&
        requestIndex <
          Math.min(
            TextAIService.MAXIMUM_INFLIGHT_AUTO_INVOKES,
            toolCallBehavior.getMaximumAutoInvokeAttempts()
          ),
    }
  }

  private static hasToolCallBeenExecuted(
    chatRequestMessages: ChatCompletionMessageParam[],
    toolChoiceName: string
  ): boolean {
    return chatRequestMessages
      .filter((m) => m.role === "assistant")
      .flatMap((f) => f.tool_calls ?? [])
      .filter((toolCall) => toolCall.function.name === toolChoiceName)
      .every((toolCall) => {
        const id = toolCall.id
        return chatRequestMessages
          .filter((chatRequestMessage) => chatRequestMessage.role === "tool")
          .some((cRM) => cRM.tool_call_id === id)
      })
  }

  private static getCompletionsOptions(
    chatCompletionService: ChatCompletionService,
    chatRequestMessages: ChatCompletionMessageParam[],
    invocationContext?: InvocationContext<ChatCompletionCreateParams>,
    toolCallConfig?: OpenAIToolCallConfig
  ): OpenAI.ChatCompletionCreateParams {
    const openAIChatRequestMessages = chatRequestMessages.map((it) =>
      OpenAIXMLPromptParser.unescapeRequest(it)
    )

    let options: OpenAI.ChatCompletionCreateParams = {
      model: chatCompletionService.modelId,
      messages: openAIChatRequestMessages,
    }

    if (toolCallConfig) {
      options.tools = toolCallConfig.tools
      options.tool_choice = toolCallConfig.toolChoice

      if (toolCallConfig.options) {
        options.parallel_tool_calls = toolCallConfig.options.isParallelCallsAllowed()
      }
    }

    const promptExecutionSettings = invocationContext?.promptExecutionSettings

    if (!promptExecutionSettings) {
      return options
    }

    if (
      promptExecutionSettings.resultsPerPrompt < 1 ||
      promptExecutionSettings.resultsPerPrompt > TextAIService.MAX_RESULTS_PER_PROMPT
    ) {
      throw new AIException(
        AIException.ErrorCodes.INVALID_REQUEST,
        `Results per prompt must be in range between 1 and ${TextAIService.MAX_RESULTS_PER_PROMPT}, inclusive.`
      )
    }

    options.n = options.n || promptExecutionSettings.resultsPerPrompt

    const promptExecutionSettingsObject = promptExecutionSettings.toObject()
    options = { ...promptExecutionSettingsObject, ...options }

    return options
  }

  private static toOpenAIChatMessageContent(
    chatCompletionMessageParams: ChatCompletionMessageParamWithCompletionUsage[]
  ): ChatMessageContent<any>[] {
    return chatCompletionMessageParams.map((chatCompletionMessageParam) => {
      const content =
        typeof chatCompletionMessageParam.content === "string"
          ? chatCompletionMessageParam.content
          : JSON.stringify(chatCompletionMessageParam.content ?? "")
      let chatMessageContent = new OpenAIChatMessageContent(
        authorRoleFromString(chatCompletionMessageParam.role),
        content
      )

      if (chatCompletionMessageParam.role === "assistant") {
        const calls = OpenAIChatCompletion.getFunctionCallContents(
          chatCompletionMessageParam.tool_calls
        )
        chatMessageContent = new OpenAIChatMessageContent(
          authorRoleFromString(chatCompletionMessageParam.role),
          content,
          undefined,
          undefined,
          undefined,
          FunctionResultMetadata.build(uuid4(), chatCompletionMessageParam.usage),
          calls
        )
      } else if (chatCompletionMessageParam.role === "tool") {
        chatMessageContent = new OpenAIChatMessageContent(
          authorRoleFromString(chatCompletionMessageParam.role),
          content,
          undefined,
          undefined,
          undefined,
          FunctionResultMetadata.build(chatCompletionMessageParam.tool_call_id),
          undefined
        )
      }

      return chatMessageContent
    })
  }

  static getFunctionCallContents(toolCalls?: ChatCompletionMessageToolCall[]) {
    if (!toolCalls) {
      return
    }

    return toolCalls.map((call) => {
      if (call.type === "function") {
        try {
          return OpenAIChatCompletion.extractFunctionCallContent(call)
        } catch (jsonError) {
          throw SKException.build("Failed to parse tool arguments", jsonError as Error)
        }
      } else {
        throw new SKException("Unknown tool call type: " + call.function.name)
      }
    })
  }

  ///

  ////

  ///

  ////

  ////

  ////

  ////

  ////

  getChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel: Kernel,
    invocationContext?: InvocationContext<ChatCompletionCreateParams>
  ): Observable<ChatMessageContent<string>[]> {
    if (typeof promptOrChatHistory === "string") {
      return this.getPromptChatMessageContentsAsync(promptOrChatHistory, kernel, invocationContext)
    } else if (promptOrChatHistory instanceof ChatHistory) {
      return this.getChatHistoryChatMessageContentsAsync(
        promptOrChatHistory,
        kernel,
        invocationContext ?? InvocationContext.Builder<ChatCompletionCreateParams>().build()
      )
    }

    throw new SKException("unrecognized prompt or chat history type")
  }

  getStreamingChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel: Kernel,
    invocationContext?: InvocationContext<ChatCompletionCreateParams>
  ): Observable<StreamingChatContent<any>> {
    let chatHistory: ChatHistory
    if (typeof promptOrChatHistory === "string") {
      chatHistory = new ChatHistory().addUserMessage(promptOrChatHistory)
    } else if (promptOrChatHistory instanceof ChatHistory) {
      chatHistory = promptOrChatHistory
    } else {
      throw new SKException("unrecognized prompt or chat history type")
    }

    return this.getChatHistoryStreamingChatMessageContentsAsync(
      chatHistory,
      kernel,
      invocationContext
    )
  }

  private getPromptChatMessageContentsAsync(
    prompt: string,
    kernel: Kernel,
    invocationContext?: InvocationContext<ChatCompletionCreateParams>
  ): Observable<ChatMessageContent<string>[]> {
    const parsedPrompt = OpenAIXMLPromptParser.parse(prompt)
    const messages = new OpenAIChatMessages(parsedPrompt.messages)

    return this.doChatMessageContentsAsync(
      messages,
      kernel,
      invocationContext ?? InvocationContext.Builder<ChatCompletionCreateParams>().build()
    ).pipe(
      map((m) => {
        let result = new ChatHistory(OpenAIChatCompletion.toOpenAIChatMessageContent(m.allMessages))

        if (invocationContext?.returnMode === InvocationReturnMode.LAST_MESSAGE_ONLY) {
          const lastMessage = result.getLastMessage()
          const msgContents = lastMessage ? [lastMessage] : []
          result = new ChatHistory(msgContents)
        }

        return result.messages
      })
    )
  }

  private getChatHistoryChatMessageContentsAsync(
    chatHistory: ChatHistory,
    kernel: Kernel,
    invocationContext: InvocationContext<ChatCompletionCreateParams>
  ): Observable<ChatMessageContent<string>[]> {
    const chatMessages = OpenAIChatMessages.fromChatHistory(chatHistory)

    return this.doChatMessageContentsAsync(chatMessages, kernel, invocationContext).pipe<
      ChatMessageContent<any>[]
    >(
      map((chatMessagesHistory) => {
        let chatHistoryResult: ChatHistory
        if (invocationContext.returnMode === InvocationReturnMode.FULL_HISTORY) {
          chatHistoryResult = new ChatHistory(chatHistory.messages)
        } else {
          chatHistoryResult = new ChatHistory()
        }

        chatHistoryResult.addAll(
          new ChatHistory(
            OpenAIChatCompletion.toOpenAIChatMessageContent(chatMessagesHistory.newMessages)
          )
        )

        chatHistoryResult.addAll(new ChatHistory(chatMessagesHistory.newChatMessageContent))

        if (
          invocationContext?.returnMode === InvocationReturnMode.LAST_MESSAGE_ONLY &&
          chatHistoryResult.getLastMessage() !== undefined
        ) {
          chatHistoryResult = new ChatHistory([chatHistoryResult.getLastMessage()!])
        }

        return chatHistoryResult.messages
      })
    )
  }

  private getChatHistoryStreamingChatMessageContentsAsync(
    chatHistory: ChatHistory,
    kernel: Kernel,
    invocationContext:
      | InvocationContext<ChatCompletionCreateParams>
      | undefined = InvocationContext.Builder<ChatCompletionCreateParams>().build()
  ): Observable<StreamingChatContent<any>> {
    if (
      invocationContext.toolCallBehavior &&
      invocationContext.toolCallBehavior.isAutoInvokeAllowed()
    ) {
      throw new SKException(
        "ToolCallBehavior auto-invoke is not supported for streaming chat message contents"
      )
    }

    if (
      invocationContext.functionChoiceBehavior &&
      invocationContext.functionChoiceBehavior instanceof AutoFunctionChoiceBehavior &&
      (invocationContext.functionChoiceBehavior as AutoFunctionChoiceBehavior).isAutoInvoke()
    ) {
      throw new SKException(
        "FunctionChoiceBehavior auto-invoke is not supported for streaming chat message contents"
      )
    }

    if (invocationContext.returnMode != InvocationReturnMode.NEW_MESSAGES_ONLY) {
      throw new SKException(
        "Streaming chat message contents only supports NEW_MESSAGES_ONLY return mode"
      )
    }

    const chatMessages = OpenAIChatMessages.fromChatHistory(chatHistory)

    const fns: OpenAIFunction[] = []
    if (kernel) {
      kernel.plugins.forEach((plugin) => {
        plugin.functions.forEach((kernelFunction) => {
          fns.push(
            OpenAIFunction.build(kernelFunction.getMetadata(), kernelFunction.getPluginName())
          )
        })
      })
    }

    const toolCallConfig = OpenAIChatCompletion.getToolCallConfig(
      invocationContext,
      fns,
      chatMessages.allMessages,
      0
    )

    const { options } = ChatCompletionUtils.executePrechatHooks(
      OpenAIChatCompletion.getCompletionsOptions(
        this,
        chatMessages.allMessages,
        invocationContext,
        toolCallConfig
      ),
      chatHistory,
      kernel,
      invocationContext
    )

    return from(this.client.chat.completions.stream({ ...options, stream: true })).pipe(
      mergeMap((chunk) => {
        return chunk.choices.map((message) => {
          const role = message.delta.role ?? AuthorRole.ASSISTANT
          return new OpenAIStreamingChatMessageContent(
            chunk.id,
            role as AuthorRole,
            message.delta.content ?? "",
            this.modelId
          ) as StreamingChatContent<any>
        })
      })
    )
  }

  private doChatMessageContentsAsync(
    messages: OpenAIChatMessages,
    kernel: Kernel,
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    requestIndex: number | undefined = 0
  ): Observable<OpenAIChatMessages> {
    const fns: OpenAIFunction[] = []
    if (kernel) {
      kernel.plugins.forEach((plugin) => {
        plugin.functions.forEach((kernelFunction) => {
          fns.push(
            OpenAIFunction.build(kernelFunction.getMetadata(), kernelFunction.getPluginName())
          )
        })
      })
    }

    return this.doChatMessageContentsWithFunctionsAsync(
      new ChatHistory(OpenAIChatCompletion.toOpenAIChatMessageContent(messages.allMessages)),
      kernel,
      fns,
      invocationContext,
      requestIndex
    )
  }

  private doChatMessageContentsWithFunctionsAsync(
    chatHistory: ChatHistory,
    kernel: Kernel,
    fns: OpenAIFunction[],
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    requestIndex: number | undefined = 0
  ): Observable<OpenAIChatMessages> {
    let messages = OpenAIChatMessages.fromChatHistory(chatHistory)
    let toolCallConfig = OpenAIChatCompletion.getToolCallConfig(
      invocationContext,
      fns,
      messages.allMessages,
      requestIndex
    )

    const { chatHistory: possiblyUpdatedChatHistory } = ChatCompletionUtils.executePrechatHooks(
      OpenAIChatCompletion.getCompletionsOptions(
        this,
        messages.allMessages,
        invocationContext,
        toolCallConfig
      ),
      chatHistory,
      kernel,
      invocationContext
    )

    // the prechatHook could have modified chat history
    messages = OpenAIChatMessages.fromChatHistory(possiblyUpdatedChatHistory)

    toolCallConfig = OpenAIChatCompletion.getToolCallConfig(
      invocationContext,
      fns,
      messages.allMessages,
      requestIndex
    )

    const options = OpenAIChatCompletion.getCompletionsOptions(
      this,
      messages.allMessages,
      invocationContext,
      toolCallConfig
    )

    return from(this.client.chat.completions.create({ ...options, stream: false })).pipe(
      mergeMap((chatCompletions) => {
        const { messages: responseMessages, functionResultMetadata } =
          this.extractChatCompletionMessages(chatCompletions)

        messages.addAll(
          responseMessages.map((m) => ({ ...m, usage: functionResultMetadata.getUsage() }))
        )

        // execute PostChatCompletionHook
        ChatCompletionUtils.executeHook(new PostChatCompletionEvent(), invocationContext, kernel)

        // Just return the result:
        // If auto-invoking is not enabled
        // Or if we are auto-invoking, but we somehow end up with other than 1 choice even though only 1 was requested
        if (!toolCallConfig || !toolCallConfig.autoInvoke || responseMessages.length !== 1) {
          return of(messages)
        }

        // Or if there are no tool calls to be done
        const response = responseMessages[0]
        const toolCalls = (response as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam)
          .tool_calls
        if (!toolCalls?.length) {
          return of(messages)
        }

        return from(toolCalls).pipe(
          reduce((requestMessagesMono, toolCall) => {
            if (toolCall.type === "function") {
              return this.performToolCall(kernel, invocationContext, requestMessagesMono, toolCall)
            }
            return requestMessagesMono
          }, of(messages)),
          mergeMap((it) => it),
          mergeMap((chatMessages) => {
            return this.doChatMessageContentsWithFunctionsAsync(
              new ChatHistory(
                OpenAIChatCompletion.toOpenAIChatMessageContent(chatMessages.allMessages)
              ),
              kernel,
              fns,
              invocationContext,
              requestIndex + 1
            )
          }),
          catchError((e: Error) => {
            console.warn("Tool invocation attempt failed: ", e)

            // If FunctionInvocationError occurred and there are still attempts left, retry, else exit
            if (requestIndex < TextAIService.MAXIMUM_INFLIGHT_AUTO_INVOKES) {
              let currentMessages = messages

              if (e instanceof FunctionInvocationError) {
                currentMessages.assertCommonHistory(e.messages)
                currentMessages = new OpenAIChatMessages(e.messages)
              }

              return this.doChatMessageContentsWithFunctionsAsync(
                new ChatHistory(
                  OpenAIChatCompletion.toOpenAIChatMessageContent(currentMessages.allMessages)
                ),
                kernel,
                fns,
                invocationContext,
                requestIndex + 1
              )
            } else {
              return throwError(() => e)
            }
          })
        )
      })
    ) as Observable<OpenAIChatMessages>
  }

  private extractChatCompletionMessages(completions: ChatCompletion): {
    functionResultMetadata: FunctionResultMetadata<CompletionUsage>
    messages: ChatCompletionMessageParam[]
  } {
    const completionMetadata = FunctionResultMetadata.build<CompletionUsage>(
      completions.id,
      completions.usage!,
      completions.created!
    )
    const messages: ChatCompletionMessageParam[] = completions.choices
      .map((m) => m.message)
      .filter(Boolean)
    return { functionResultMetadata: completionMetadata, messages }
  }

  private performToolCall(
    kernel: Kernel,
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    requestMessages: Observable<OpenAIChatMessages>,
    toolCall: ChatCompletionMessageToolCall
  ): Observable<OpenAIChatMessages> {
    return requestMessages.pipe(
      mergeMap((messages) => {
        const functionToolCall = toolCall

        return this.invokeFunctionTool(kernel, invocationContext, functionToolCall).pipe(
          map((functionResult) => {
            const requestToolMessage: ChatCompletionToolMessageParam = {
              role: "tool",
              tool_call_id: functionToolCall.id,
              content: functionResult.result,
            }
            return messages.add(requestToolMessage)
          })
        )
      })
    ) as Observable<OpenAIChatMessages>
  }

  private invokeFunctionTool(
    kernel: Kernel,
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    functionToolCall: ChatCompletionMessageToolCall
  ): Observable<FunctionResult<string>> {
    const functionCallContent: FunctionCallContent<any> =
      OpenAIChatCompletion.extractFunctionCallContent(functionToolCall)

    const pluginName = functionCallContent.pluginName

    if (!pluginName) {
      return throwError(() => new SKException("Plugin name is required for function tool call"))
    }

    let fn = kernel.getFunction<string>(pluginName, functionCallContent.functionName)

    const hookResult: PreToolCallEvent = ChatCompletionUtils.executeHook(
      new PreToolCallEvent(
        functionCallContent.functionName,
        functionCallContent.kernelArguments ?? KernelArguments.Builder().build(),
        fn
      ),
      invocationContext,
      kernel
    )

    fn = hookResult.getFunction()
    const kernelArguments = hookResult.getArguments()

    return fn.invokeAsync(kernel, kernelArguments, invocationContext)
  }

  private static extractFunctionCallContent(
    toolCall: ChatCompletionMessageToolCall
  ): FunctionCallContent<any> {
    // Split the full name of a function into plugin and function name
    const name = toolCall.function.name
    const parts = name.split(ToolCallBehavior.FUNCTION_NAME_SEPARATOR)
    const pluginName = parts.length > 1 ? parts[0] : ""
    const fnName = parts.length > 1 ? parts[1] : parts[0]
    const kernelArguments = KernelArguments.Builder().build()

    const jsonToolCallArguments = JSON.parse(toolCall.function.arguments)

    for (const [k, v] of Object.entries(jsonToolCallArguments)) {
      kernelArguments.set(k, v)
    }

    return new FunctionCallContent(fnName, pluginName, toolCall.id, kernelArguments)
  }
}

/**
 * Builder for creating a new instance of {@link OpenAIChatCompletion}.
 */
class OpenAIChatCompletionBuilder extends AIServiceBuilder<
  OpenAI,
  OpenAIChatCompletion,
  OpenAIChatCompletionBuilder
> {
  public build(): OpenAIChatCompletion {
    if (!this.client || !this.modelId) {
      throw new AIException(AIException.ErrorCodes.INVALID_REQUEST)
    }

    if (!this.deploymentName) {
      Logger.debug("Deployment name is not provided, using model id as deployment name")
      this.deploymentName = this.modelId
    }

    return new OpenAIChatCompletion(this.client, this.deploymentName, this.modelId, this.serviceId)
  }
}
