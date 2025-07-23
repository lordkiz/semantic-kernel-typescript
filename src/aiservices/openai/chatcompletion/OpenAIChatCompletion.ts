import OpenAI from "openai"
import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionSystemMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
  ChatCompletionToolMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources"
import {
  catchError,
  defaultIfEmpty,
  from,
  map,
  mergeMap,
  Observable,
  of,
  reduce,
  throwError,
} from "rxjs"
import FunctionCallContent from "../../../semantickernel/contents/FunctionCallContent"
import AIException from "../../../semantickernel/exceptions/AIException"
import SKException from "../../../semantickernel/exceptions/SKException"
import AutoFunctionChoiceBehavior from "../../../semantickernel/functionchoice/AutoFunctionChoiceBehavior"
import FunctionChoiceBehavior from "../../../semantickernel/functionchoice/FunctionChoiceBehavior"
import NoneFunctionChoiceBehavior from "../../../semantickernel/functionchoice/NoneFunctionChoiceBehavior"
import RequiredFunctionChoiceBehavior from "../../../semantickernel/functionchoice/RequiredFunctionChoiceBehavior"
import KernelArguments from "../../../semantickernel/functions/KernelArguments"
import {
  PostChatCompletionEvent,
  PreChatCompletionEvent,
} from "../../../semantickernel/hooks/ChatCompletionEvents"
import KernelHooks from "../../../semantickernel/hooks/KernelHooks"
import { PreToolCallEvent } from "../../../semantickernel/hooks/PreToolCallEvent"
import { KernelHookEvent } from "../../../semantickernel/hooks/types/KernelHookEvent"
import Kernel from "../../../semantickernel/Kernel"
import { Logger } from "../../../semantickernel/log/Logger"
import FunctionResult from "../../../semantickernel/orchestration/FunctionResult"
import FunctionResultMetadata from "../../../semantickernel/orchestration/FunctionResultMetadata"
import InvocationContext from "../../../semantickernel/orchestration/InvocationContext"
import { InvocationReturnMode } from "../../../semantickernel/orchestration/InvocationReturnMode"
import ToolCallBehavior, {
  AllowedKernelFunctions,
  RequiredKernelFunction,
} from "../../../semantickernel/orchestration/ToolCallBehavior"
import {
  AuthorRole,
  authorRoleFromString,
} from "../../../semantickernel/services/chatcompletion/AuthorRole"
import { ChatCompletionService } from "../../../semantickernel/services/chatcompletion/ChatCompletionService"
import ChatHistory from "../../../semantickernel/services/chatcompletion/ChatHistory"
import ChatMessageContent from "../../../semantickernel/services/chatcompletion/ChatMessageContent"
import { ChatMessageContentType } from "../../../semantickernel/services/chatcompletion/message/ChatMessageContentType"
import ChatMessageImageContent from "../../../semantickernel/services/chatcompletion/message/ChatMessageImageContent"
import { StreamingChatContent } from "../../../semantickernel/services/chatcompletion/StreamingChatContent"
import { OpenAiServiceBuilder } from "../../../semantickernel/services/openai/OpenAiServiceBuilder"
import { TextAIService } from "../../../semantickernel/services/types/TextAIService"
import { OpenAIService } from "../OpenAIService"
import FunctionInvocationError from "./FunctionInvocationError"
import OpenAIChatMessageContent from "./OpenAIChatMessageContent"
import OpenAIChatMessages from "./OpenAIChatMessages"
import OpenAIFunction from "./OpenAIFunction"
import OpenAIStreamingChatMessageContent from "./OpenAIStreamingChatMessageContent"
import { OpenAIToolCallConfig } from "./OpenAIToolCallConfig"
import { OpenAIToolChoice } from "./OpenAIToolChoice"
import { OpenAiXMLPromptParser } from "./OpenAiXMLPromptParser"

export default class OpenAIChatCompletion
  extends OpenAIService<OpenAI>
  implements ChatCompletionService
{
  private LOGGER = Logger

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

    if (
      !invocationContext.getFunctionChoiceBehavior() ||
      !invocationContext.getToolCallBehavior()
    ) {
      return
    }

    if (invocationContext.getFunctionChoiceBehavior()) {
      return OpenAIChatCompletion.getFunctionChoiceBehaviorConfig(
        invocationContext.getFunctionChoiceBehavior()!,
        fns,
        requestIndex
      )
    }
    return OpenAIChatCompletion.getToolCallBehaviorConfig(
      invocationContext.getToolCallBehavior() ?? new ToolCallBehavior(),
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

    const toolDefinitions: ChatCompletionTool[] = fns
      .filter((fn) => functionChoiceBehavior.isFunctionAllowed(fn.getPluginName(), fn.getName()))
      .map((fn) => fn.getFunctionDefinition())
      .map((def) => ({ type: "function", function: def }))

    return {
      tools: toolDefinitions,
      toolChoice,
      autoInvoke,
      options: functionChoiceBehavior.getOptions(),
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
            enabledKernelFunctions.isFunctionAllowed(fn.getPluginName(), fn.getName())
        )
        .map((fn) => fn.getFunctionDefinition())
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

  private static executeHook<T extends KernelHookEvent<any>>(
    event: T,
    invocationContext?: InvocationContext<ChatCompletionCreateParams>,
    kernel?: Kernel
  ): T {
    const kernelHooks = KernelHooks.merge(
      kernel?.getGlobalKernelHooks(),
      invocationContext?.getKernelHooks()
    )
    if (!kernelHooks) {
      return event
    }
    return kernelHooks.executeHooks(event)
  }

  private static getCompletionsOptions(
    chatCompletionService: ChatCompletionService,
    chatRequestMessages: ChatCompletionMessageParam[],
    invocationContext?: InvocationContext<ChatCompletionCreateParams>,
    toolCallConfig?: OpenAIToolCallConfig
  ): OpenAI.ChatCompletionCreateParams {
    const openAIChatRequestMessages = chatRequestMessages.map((it) =>
      OpenAiXMLPromptParser.unescapeRequest(it)
    )

    let options: OpenAI.ChatCompletionCreateParams = {
      model: chatCompletionService.getModelId(),
      messages: openAIChatRequestMessages,
    }

    if (toolCallConfig) {
      options.tools = toolCallConfig.tools
      options.tool_choice = toolCallConfig.toolChoice

      if (toolCallConfig.options) {
        options.parallel_tool_calls = toolCallConfig.options.isParallelCallsAllowed()
      }
    }

    const promptExecutionSettings = invocationContext?.getPromptExecutionSettings()

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

  private static getChatCopleteionMessageParams(messages: ChatMessageContent<any>[]) {
    return messages.map((c) => OpenAIChatCompletion.getChatCopleteionMessageParam(c))
  }

  private static getChatCopleteionMessageParam(
    message: ChatMessageContent<any>
  ): ChatCompletionMessageParam {
    const authorRole = message.getAuthorRole()
    const content = message.getContent()

    if (message.getContentType() === ChatMessageContentType.IMAGE_URL && content) {
      return OpenAIChatCompletion.formImageMessage(message, content)
    }

    switch (authorRole) {
      case AuthorRole.ASSISTANT:
        return OpenAIChatCompletion.formAssistantMessage(message, content)
      case AuthorRole.SYSTEM: {
        const chatCompletionSystemMessageParam: ChatCompletionSystemMessageParam = {
          role: "system",
          content,
        }
        return chatCompletionSystemMessageParam
      }
      case AuthorRole.USER: {
        const chatCompletionUserMessageParam: ChatCompletionUserMessageParam = {
          role: "user",
          content,
        }
        return chatCompletionUserMessageParam
      }
      case AuthorRole.TOOL: {
        const id = message.getMetadata()?.getId()
        if (!id) {
          throw new SKException(
            "Require to create a tool call message, but no tool call id is available"
          )
        }
        const chatCompletionToolMessageParam: ChatCompletionToolMessageParam = {
          role: "tool",
          content,
          tool_call_id: id,
        }
        return chatCompletionToolMessageParam
      }
      default:
        Logger.debug(`Unexpected author role: ${authorRole}`)
        throw new SKException("Unexpected author role: " + authorRole)
    }
  }

  private static toOpenAIChatMessageContent(
    chatCompletionMessageParams: ChatCompletionMessageParam[]
  ): ChatMessageContent<any>[] {
    return chatCompletionMessageParams.map((chatCompletionMessageParam) => {
      let chatMessageContent = new OpenAIChatMessageContent(
        authorRoleFromString(chatCompletionMessageParam.role),
        chatCompletionMessageParam.content?.toString() ?? ""
      )

      if (chatCompletionMessageParam.role === "assistant") {
        const calls = OpenAIChatCompletion.getFunctionCallContents(
          chatCompletionMessageParam.tool_calls
        )
        chatMessageContent = new OpenAIChatMessageContent(
          authorRoleFromString(chatCompletionMessageParam.role),
          chatCompletionMessageParam.content?.toString() ?? "",
          undefined,
          undefined,
          undefined,
          undefined,
          calls
        )
      } else if (chatCompletionMessageParam.role === "tool") {
        chatMessageContent = new OpenAIChatMessageContent(
          authorRoleFromString(chatCompletionMessageParam.role),
          chatCompletionMessageParam.content?.toString() ?? "",
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

  static formAssistantMessage(
    message: ChatMessageContent<any>,
    content?: string
  ): ChatCompletionAssistantMessageParam {
    const assistantMessage: ChatCompletionAssistantMessageParam = { role: "assistant", content }
    const toolCalls = FunctionCallContent.getFunctionTools(message)

    if (toolCalls) {
      assistantMessage.tool_calls = toolCalls.map((toolCall) => {
        const kernelArguments = toolCall.kernelArguments
        const args =
          kernelArguments && kernelArguments.size > 0
            ? JSON.stringify(
                Object.keys(kernelArguments).reduce(
                  (acc, key) => {
                    acc[key] = kernelArguments.get(key)?.getValue()
                    return acc
                  },
                  {} as Record<string, any>
                )
              )
            : "{}"

        let prefix = ""
        if (toolCall.pluginName) {
          prefix = toolCall.pluginName + ToolCallBehavior.FUNCTION_NAME_SEPARATOR
        }

        const name = prefix + toolCall.functionName
        const fn = {
          name,
          arguments: args,
        }
        const functionToolCall: ChatCompletionMessageToolCall = {
          id: name,
          function: fn,
          type: "function",
        }
        return functionToolCall
      })
    }

    return assistantMessage
  }

  static formImageMessage(
    message: ChatMessageContent<any>,
    content: string
  ): ChatCompletionUserMessageParam {
    const imageUrl: ChatCompletionContentPartImage.ImageURL = {
      url: content,
      detail: (message as ChatMessageImageContent<any>)
        .getDetail()
        ?.toLowerCase() as ChatCompletionContentPartImage.ImageURL["detail"],
    }

    return {
      content: [
        {
          image_url: imageUrl,
          type: "image_url",
        },
      ],
      role: "user",
    }
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
    const parsedPromt = OpenAiXMLPromptParser.parse(prompt)
    const messages = new OpenAIChatMessages(parsedPromt.messages)

    return this.doChatMessageContentsAsync(
      messages,
      kernel,
      invocationContext ?? InvocationContext.Builder<ChatCompletionCreateParams>().build()
    ).pipe(
      map((m) => {
        let result = new ChatHistory(
          OpenAIChatCompletion.toOpenAIChatMessageContent(m.getAllMessages())
        )

        if (invocationContext?.returnMode() === InvocationReturnMode.LAST_MESSAGE_ONLY) {
          const lastMessage = result.getLastMessage()
          const msgContents = lastMessage ? [lastMessage] : []
          result = new ChatHistory(msgContents)
        }

        return result.getMessages()
      })
    )
  }

  private getChatHistoryChatMessageContentsAsync(
    chatHistory: ChatHistory,
    kernel: Kernel,
    invocationContext: InvocationContext<ChatCompletionCreateParams>
  ): Observable<ChatMessageContent<string>[]> {
    const chatCompletiontMessageParams = OpenAIChatCompletion.getChatCopleteionMessageParams(
      chatHistory.getMessages()
    )
    const chatMessages = new OpenAIChatMessages(chatCompletiontMessageParams)

    return this.doChatMessageContentsAsync(chatMessages, kernel, invocationContext).pipe<
      ChatMessageContent<any>[]
    >(
      map((chatMessagesHistory) => {
        let chatHistoryResult: ChatHistory
        if (invocationContext.returnMode() === InvocationReturnMode.FULL_HISTORY) {
          chatHistoryResult = new ChatHistory(chatHistory.getMessages())
        } else {
          chatHistoryResult = new ChatHistory()
        }

        chatHistoryResult.addAll(
          new ChatHistory(
            OpenAIChatCompletion.toOpenAIChatMessageContent(chatMessagesHistory.getNewMessages())
          )
        )

        chatHistoryResult.addAll(new ChatHistory(chatMessagesHistory.getNewChatMessageContent()))

        if (
          invocationContext?.returnMode() === InvocationReturnMode.LAST_MESSAGE_ONLY &&
          chatHistoryResult.getLastMessage() !== undefined
        ) {
          chatHistoryResult = new ChatHistory([chatHistoryResult.getLastMessage()!])
        }

        return chatHistoryResult.getMessages()
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
      invocationContext.getToolCallBehavior() &&
      invocationContext.getToolCallBehavior()?.isAutoInvokeAllowed()
    ) {
      throw new SKException(
        "ToolCallBehavior auto-invoke is not supported for streaming chat message contents"
      )
    }

    if (
      invocationContext.getFunctionChoiceBehavior() &&
      invocationContext.getFunctionChoiceBehavior() instanceof AutoFunctionChoiceBehavior &&
      (invocationContext.getFunctionChoiceBehavior() as AutoFunctionChoiceBehavior).isAutoInvoke()
    ) {
      throw new SKException(
        "FunctionChoiceBehavior auto-invoke is not supported for streaming chat message contents"
      )
    }

    if (invocationContext.returnMode() != InvocationReturnMode.NEW_MESSAGES_ONLY) {
      throw new SKException(
        "Streaming chat message contents only supports NEW_MESSAGES_ONLY return mode"
      )
    }

    const chatCompletiontMessageParams = OpenAIChatCompletion.getChatCopleteionMessageParams(
      chatHistory.getMessages()
    )

    const chatMessages = new OpenAIChatMessages(chatCompletiontMessageParams)

    const fns: OpenAIFunction[] = []
    if (kernel) {
      kernel.getPlugins().forEach((plugin) => {
        plugin.getFunctions().forEach((kernelFunction) => {
          fns.push(
            OpenAIFunction.build(kernelFunction.getMetadata(), kernelFunction.getPluginName())
          )
        })
      })
    }

    const { options } = this.executePrechatHooks(chatMessages, kernel, fns, invocationContext, 0)

    return from(this.getClient().chat.completions.stream({ ...options, stream: true })).pipe(
      mergeMap((chunk) => {
        return chunk.choices.map((message) => {
          const role = message.delta.role ?? AuthorRole.ASSISTANT
          return new OpenAIStreamingChatMessageContent(
            chunk.id,
            role as AuthorRole,
            message.delta.content ?? "",
            this.getModelId()
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
      kernel.getPlugins().forEach((plugin) => {
        plugin.getFunctions().forEach((kernelFunction) => {
          fns.push(
            OpenAIFunction.build(kernelFunction.getMetadata(), kernelFunction.getPluginName())
          )
        })
      })
    }

    return this.doChatMessageContentsWithFunctionsAsync(
      messages,
      kernel,
      fns,
      invocationContext,
      requestIndex
    )
  }

  private doChatMessageContentsWithFunctionsAsync(
    messages: OpenAIChatMessages,
    kernel: Kernel,
    fns: OpenAIFunction[],
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    requestIndex: number | undefined = 0
  ): Observable<OpenAIChatMessages> {
    const { options, toolCallConfig } = this.executePrechatHooks(
      messages,
      kernel,
      fns,
      invocationContext,
      requestIndex
    )

    return from(this.getClient().chat.completions.create({ ...options, stream: false })).pipe(
      mergeMap((chatCompletions) => {
        const responseMessages = chatCompletions.choices.map((m) => m.message).filter(Boolean)

        // execute PostChatCompletionHook
        OpenAIChatCompletion.executeHook(new PostChatCompletionEvent(), invocationContext, kernel)

        // Just return the result:
        // If auto-invoking is not enabled
        // Or if we are auto-invoking, but we somehow end up with other than 1 choice even though only 1 was requested
        if (!toolCallConfig || !toolCallConfig.autoInvoke || responseMessages.length !== 1) {
          const chatMessageContents = OpenAIChatCompletion.toOpenAIChatMessageContent(
            this.extractChatCompletionMessages(chatCompletions)
          )
          return of(messages.addChatMessage(chatMessageContents))
        }

        // Or if there are no tool calls to be done
        const response = responseMessages[0]
        const toolCalls = response.tool_calls
        if (!toolCalls?.length) {
          const chatMessageContents = OpenAIChatCompletion.toOpenAIChatMessageContent(
            this.extractChatCompletionMessages(chatCompletions)
          )
          return of(messages.addChatMessage(chatMessageContents))
        }

        const requestMessage: ChatCompletionAssistantMessageParam = {
          role: "assistant",
          tool_calls: toolCalls,
          content: response.content,
        }

        const messagesWithToolCall = messages.add(requestMessage) as OpenAIChatMessages

        return from(toolCalls).pipe(
          reduce((requestMessagesMono, toolCall) => {
            if (toolCall.type === "function") {
              return this.performToolCall(kernel, invocationContext, requestMessagesMono, toolCall)
            }
            return requestMessagesMono
          }, of(messagesWithToolCall)),
          mergeMap((it) => it),
          mergeMap((chatMessages) =>
            this.doChatMessageContentsWithFunctionsAsync(
              chatMessages,
              kernel,
              fns,
              invocationContext,
              requestIndex + 1
            )
          ),
          catchError((e: Error) => {
            console.warn("Tool invocation attempt failed: ", e)

            // If FunctionInvocationError occurred and there are still attempts left, retry, else exit
            if (requestIndex < TextAIService.MAXIMUM_INFLIGHT_AUTO_INVOKES) {
              let currentMessages = messages

              if (e instanceof FunctionInvocationError) {
                currentMessages.assertCommonHistory(e.getMessages())
                currentMessages = new OpenAIChatMessages(e.getMessages())
              }

              return this.doChatMessageContentsWithFunctionsAsync(
                currentMessages,
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

  private executePrechatHooks(
    messages: OpenAIChatMessages,
    kernel: Kernel,
    fns: OpenAIFunction[],
    invocationContext: InvocationContext<ChatCompletionCreateParams>,
    requestIndex: number
  ): { options: ChatCompletionCreateParams; toolCallConfig: OpenAIToolCallConfig | undefined } {
    const toolCallConfig = OpenAIChatCompletion.getToolCallConfig(
      invocationContext,
      fns,
      messages.getAllMessages(),
      requestIndex
    )

    const options = OpenAIChatCompletion.executeHook(
      new PreChatCompletionEvent(
        OpenAIChatCompletion.getCompletionsOptions(
          this,
          messages.getAllMessages(),
          invocationContext,
          toolCallConfig
        )
      ),
      invocationContext,
      kernel
    ).getOptions()

    return { options, toolCallConfig }
  }

  private extractChatCompletionMessages(completions: ChatCompletion): ChatCompletionMessageParam[] {
    // const completionMetadata = FunctionResultMetadata.build<CompletionUsage>(
    //   completions.id,
    //   completions.usage!,
    //   completions.created!
    // )
    const messages: ChatCompletionMessageParam[] = completions.choices
      .map((m) => m.message)
      .filter(Boolean)
    return messages
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
              content: functionResult.getResult(),
            }
            return messages.add(requestToolMessage)
          }),
          defaultIfEmpty(
            messages.add({
              role: "tool",
              tool_call_id: functionToolCall.id,
              content: "Completed successfully with no return value",
            })
          )
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

    const hookResult: PreToolCallEvent = OpenAIChatCompletion.executeHook(
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
class OpenAIChatCompletionBuilder extends OpenAiServiceBuilder<
  OpenAI,
  OpenAIChatCompletion,
  OpenAIChatCompletionBuilder
> {
  LOGGER = Logger
  public build(): OpenAIChatCompletion {
    if (!this.client || !this.modelId) {
      throw new AIException(AIException.ErrorCodes.INVALID_REQUEST)
    }

    if (!this.deploymentName) {
      this.LOGGER.debug("Deployment name is not provided, using model id as deployment name")
      this.deploymentName = this.modelId
    }

    return new OpenAIChatCompletion(this.client, this.deploymentName, this.modelId, this.serviceId)
  }
}
