import {
  Content,
  createPartFromFunctionResponse,
  FunctionCall,
  FunctionCallingConfigMode,
  FunctionDeclaration,
  GenerateContentConfig,
  GenerateContentParameters,
  GenerateContentResponse,
  GoogleGenAI,
  ToolConfig,
} from "@google/genai"
import { Kernel } from "@semantic-kernel-typescript/core"
import { AIServiceBuilder } from "@semantic-kernel-typescript/core/builders"
import { AIException, SKException } from "@semantic-kernel-typescript/core/exceptions"
import {
  AutoFunctionChoiceBehavior,
  FunctionChoiceBehavior,
  NoneFunctionChoiceBehavior,
  RequiredFunctionChoiceBehavior,
} from "@semantic-kernel-typescript/core/functionchoice"
import { KernelArguments, KernelFunction } from "@semantic-kernel-typescript/core/functions"
import { PostChatCompletionEvent } from "@semantic-kernel-typescript/core/hooks"
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
import { from, mergeMap, Observable, throwError } from "rxjs"
import { v4 as uuidv4 } from "uuid"
import { GeminiService } from "../GeminiService"
import { GeminiChatMessageContent } from "./GeminiChatMessageContent"
import { GeminiFunction } from "./GeminiFunction"
import { GeminiFunctionCallContent } from "./GeminiFunctionCallContent"
import { GeminiStreamingChatMessageContent } from "./GeminiStreamingChatMessageContent"
import { GeminiXMLPromptParser } from "./GeminiXMLPromptParser"

export class GeminiChatCompletion extends GeminiService implements ChatCompletionService {
  constructor(client: GoogleGenAI, modelId: string, deploymentName?: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder() {
    return new GeminiChatCompletionBuilder()
  }

  ///
  ///
  ///
  ///
  ///
  ///
  ///
  ///

  getChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel: Kernel,
    invocationContext?: InvocationContext<GenerateContentConfig>
  ): Observable<ChatMessageContent<string>[]> {
    const chatHistory =
      typeof promptOrChatHistory === "string"
        ? GeminiXMLPromptParser.parse(promptOrChatHistory).chatHistory
        : promptOrChatHistory

    return this.doChatMessageContentsAsync(
      new ChatHistory(chatHistory.messages),
      new ChatHistory(),
      kernel,
      invocationContext ?? InvocationContext.Builder().build(),
      Math.min(
        TextAIService.MAXIMUM_INFLIGHT_AUTO_INVOKES,
        invocationContext?.toolCallBehavior?.getMaximumAutoInvokeAttempts() ?? 0
      )
    )
  }

  getStreamingChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel: Kernel,
    invocationContext?: InvocationContext<GenerateContentConfig>
  ): Observable<StreamingChatContent<any>> {
    Logger.warn(
      "Streaming has been called on GeminiChatCompletion service. " +
        "This is currently not supported in Gemini. " +
        "The results will be returned in a non streaming fashion."
    )
    return this.getChatMessageContentsAsync(promptOrChatHistory, kernel, invocationContext).pipe(
      mergeMap((contents) => {
        return contents.map(
          (content) =>
            new GeminiStreamingChatMessageContent(
              uuidv4(),
              content.AuthorRole,
              content.content,
              this.modelId,
              content.innerContent,
              content.encoding,
              content.getMetadata()
            )
        )
      })
    )
  }

  private doChatMessageContentsAsync(
    fullHistory: ChatHistory,
    newHistory: ChatHistory,
    kernel: Kernel,
    invocationContext: InvocationContext<GenerateContentConfig>,
    invocationAttempts: number | undefined = 0
  ): Observable<ChatMessageContent<any>[]> {
    try {
      const chatMsgContentResponse = this._performChatMessageContentsAsyncCall(
        fullHistory,
        newHistory,
        kernel,
        invocationContext,
        invocationAttempts
      )
      return from(chatMsgContentResponse)
    } catch (e) {
      return throwError(() => e)
    }
  }

  private async _performChatMessageContentsAsyncCall(
    fullHistory: ChatHistory,
    newHistory: ChatHistory,
    kernel: Kernel,
    invocationContext: InvocationContext<GenerateContentConfig>,
    invocationAttempts: number | undefined = 0
  ): Promise<ChatMessageContent<any>[]> {
    const omitTools = fullHistory.getLastMessage()?.AuthorRole === AuthorRole.TOOL
    const initialOptions = this.getConfig(kernel, invocationContext, omitTools)

    const { options: config, chatHistory: possiblyUpdatedChatHistory } =
      ChatCompletionUtils.executePrechatHooks(
        initialOptions,
        fullHistory,
        kernel,
        invocationContext
      )

    const contents = this.getContents(possiblyUpdatedChatHistory)

    const generateContentResponse = await this.client.models.generateContent({
      model: this.modelId,
      config,
      contents,
    })

    const geminiChatMessageContent =
      this.getGeminiChatMessageContentFromResponse(generateContentResponse)

    fullHistory.addChatMessageContent(geminiChatMessageContent)
    newHistory.addChatMessageContent(geminiChatMessageContent)

    // execute PostChatCompletionHook
    ChatCompletionUtils.executeHook(new PostChatCompletionEvent(), invocationContext, kernel)

    if (!generateContentResponse.functionCalls?.length) {
      if (invocationContext.returnMode === InvocationReturnMode.FULL_HISTORY) {
        return fullHistory.messages
      }

      if (invocationContext.returnMode === InvocationReturnMode.LAST_MESSAGE_ONLY) {
        const lastMessage = new ChatHistory()
        lastMessage.addChatMessageContent(geminiChatMessageContent)
        return lastMessage.messages
      }

      return newHistory.messages
    }

    const functionResults = generateContentResponse.functionCalls.map((geminiFunctionCall) => {
      return {
        result: this.performFunctionCall(kernel, invocationContext, geminiFunctionCall),
        geminiFunctionCall,
      }
    })

    functionResults.forEach(async (res) => {
      const functionResult = await res.result
      const functionCallContent = new GeminiFunctionCallContent(
        res.geminiFunctionCall,
        functionResult
      )
      const functionResponsesMessage = new GeminiChatMessageContent<any>(
        AuthorRole.TOOL,
        functionCallContent.functionResult?.result,
        undefined,
        undefined,
        undefined,
        undefined,
        [functionCallContent]
      )

      fullHistory.addChatMessageContent(functionResponsesMessage)
      newHistory.addChatMessageContent(functionResponsesMessage)
    })

    return this._performChatMessageContentsAsyncCall(
      fullHistory,
      newHistory,
      kernel,
      invocationContext,
      invocationAttempts - 1
    )
  }

  /**
   * Invoke the Gemini function call.
   * @param kernel The semantic kernel
   * @param invocationContext Additional context for the invocation
   * @param geminiFunction The Gemini function call
   * @return The result of the function call
   */
  performFunctionCall(
    kernel: Kernel,
    invocationContext: InvocationContext,
    geminiFunction: FunctionCall
  ): Promise<FunctionResult<any>> {
    const name = geminiFunction.name?.split(ToolCallBehavior.FUNCTION_NAME_SEPARATOR) ?? []

    const pluginName = name[0]
    const functionName = name[1]

    const plugin = kernel.getPlugin(pluginName)
    if (!plugin) {
      throw new AIException(
        AIException.ErrorCodes.INVALID_REQUEST,
        `Plugin ${pluginName} not found in kernel`
      )
    }

    const kernelFunction = plugin.get(functionName)

    if (!kernelFunction) {
      throw new AIException(
        AIException.ErrorCodes.INVALID_REQUEST,
        `Kernel function ${functionName} not found in plugin ${pluginName}`
      )
    }

    const kernelArgs = KernelArguments.Builder()

    Object.keys(geminiFunction.args ?? {}).forEach((key) => {
      kernelArgs.withVariable(key, geminiFunction.args![key])
    })

    return kernelFunction.invoke(kernel, kernelArgs.build())
  }

  private getGenerateContentParams(
    kernel: Kernel,
    invocationContext: InvocationContext<GenerateContentConfig>
  ): GenerateContentParameters {
    const contents = {
      role: "user",
      parts: [],
    }

    const settings = invocationContext.promptExecutionSettings
    if (
      settings &&
      (settings.resultsPerPrompt < 1 ||
        settings.resultsPerPrompt > TextAIService.MAX_RESULTS_PER_PROMPT)
    ) {
      throw new AIException(
        AIException.ErrorCodes.INVALID_REQUEST,
        `Results per prompt must be in range between 1 and ${TextAIService.MAX_RESULTS_PER_PROMPT}, inclusive.`
      )
    }

    return {
      contents: [contents],
      model: this.modelId,
      config: Object.assign(invocationContext.promptExecutionSettings ?? {}),
    }
  }

  private getContents(chatHistory: ChatHistory): Content[] {
    const contents: Content[] = []

    chatHistory.messages.forEach((chatMessageContent) => {
      const content: Content = { role: AuthorRole.USER }

      if (chatMessageContent.AuthorRole === AuthorRole.ASSISTANT) {
        content.role = AuthorRole.MODEL
        const isAFunctionCall = Boolean(chatMessageContent.items?.length)
        if (isAFunctionCall) {
          ;((chatMessageContent.items ?? []) as GeminiFunctionCallContent[]).forEach(
            (geminiFunctionCall) => {
              content.parts = [
                ...(content.parts ?? []),
                { functionCall: geminiFunctionCall.functionCall },
              ]
            }
          )
        } else {
          content.parts = [...(content.parts ?? []), { text: chatMessageContent.content }]
        }
      } else if (chatMessageContent.AuthorRole === AuthorRole.TOOL) {
        content.role = AuthorRole.USER

        const fns = GeminiFunctionCallContent.getFunctionTools(chatMessageContent)

        fns.forEach((geminiFunctionCall) => {
          const functionResult = geminiFunctionCall.functionResult

          if (!functionResult || !functionResult?.result) {
            throw new SKException("Gemini failed to return a result")
          }

          if (!geminiFunctionCall.id) {
            throw new SKException(`No id found on gemini function ${geminiFunctionCall.fullName}`)
          }

          const part = createPartFromFunctionResponse(
            geminiFunctionCall.id,
            geminiFunctionCall.fullName,
            { result: functionResult.result }
          )

          content.parts = [...(content.parts ?? []), part]
        })
      } else {
        content.parts = [...(content.parts ?? []), { text: chatMessageContent.content }]
      }

      contents.push(content)
    })

    return contents
  }

  private getConfig(
    kernel: Kernel,
    invocationContext: InvocationContext<GenerateContentConfig>,
    omitTools?: boolean
  ) {
    const config: GenerateContentConfig = Object.assign(
      invocationContext.promptExecutionSettings?.toObject() ?? {}
    )

    if (omitTools) {
      return config
    }

    const tools = this.getTools(
      kernel,
      invocationContext.functionChoiceBehavior,
      invocationContext.toolCallBehavior
    )

    if (tools) {
      const { functionDeclarations, toolConfig } = tools
      config.tools = [{ functionDeclarations }]
      config.toolConfig = toolConfig
    }

    return config
  }

  private getTools(
    kernel: Kernel,
    functionChoiceBehavior?: FunctionChoiceBehavior,
    toolCallBehavior?: ToolCallBehavior
  ): { functionDeclarations: FunctionDeclaration[]; toolConfig?: ToolConfig } | undefined {
    if (!functionChoiceBehavior && !toolCallBehavior) {
      return
    }

    if (functionChoiceBehavior) {
      return this.getFunctionChoiceBehaviorToolsConfig(functionChoiceBehavior, kernel)
    } else if (toolCallBehavior) {
      return this.getToolCallBehaviourToolsConfig(toolCallBehavior, kernel)
    }
  }

  private getFunctionChoiceBehaviorToolsConfig(
    functionChoiceBehavior: FunctionChoiceBehavior,
    kernel: Kernel
  ): { functionDeclarations: FunctionDeclaration[]; toolConfig?: ToolConfig } | undefined {
    const fns: KernelFunction<any>[] = []

    kernel.plugins.forEach((plugin) => {
      plugin.functions.forEach((kernelFunction) => {
        fns.push(kernelFunction)
      })
    })

    if (!fns.length) {
      return
    }

    let allowedPluginFunctions = fns

    if (functionChoiceBehavior.functions?.length) {
      // if you specified list of functions to allow, then only those will be allowed
      allowedPluginFunctions = allowedPluginFunctions.filter((fn) =>
        functionChoiceBehavior.isFunctionAllowed(fn.getPluginName(), fn.getName())
      )
    }

    const functionDeclarations = allowedPluginFunctions.map((kernelFunction) =>
      GeminiChatCompletion.buildFunctionDeclaration(kernelFunction)
    )

    let mode: FunctionCallingConfigMode = FunctionCallingConfigMode.MODE_UNSPECIFIED
    if (functionChoiceBehavior instanceof RequiredFunctionChoiceBehavior) {
      mode = FunctionCallingConfigMode.ANY
    } else if (functionChoiceBehavior instanceof AutoFunctionChoiceBehavior) {
      mode = FunctionCallingConfigMode.AUTO
    } else if (functionChoiceBehavior instanceof NoneFunctionChoiceBehavior) {
      mode = FunctionCallingConfigMode.NONE
    }
    const toolConfig: ToolConfig = {
      functionCallingConfig: {
        mode,
        allowedFunctionNames:
          mode === FunctionCallingConfigMode.ANY
            ? functionDeclarations.map((d) => d.name ?? "").filter(Boolean)
            : undefined,
      },
    }

    return {
      functionDeclarations,
      toolConfig,
    }
  }

  private getToolCallBehaviourToolsConfig(
    toolCallBehavior: ToolCallBehavior,
    kernel: Kernel
  ): { functionDeclarations: FunctionDeclaration[]; toolConfig?: ToolConfig } | undefined {
    const fns: KernelFunction<any>[] = []

    kernel.plugins.forEach((plugin) => {
      plugin.functions.forEach((kernelFunction) => {
        fns.push(kernelFunction)
      })
    })

    if (!fns.length) {
      return
    }

    let allowedPluginFunctions = fns
    let mode: FunctionCallingConfigMode = FunctionCallingConfigMode.AUTO

    if (toolCallBehavior instanceof RequiredKernelFunction) {
      mode = FunctionCallingConfigMode.ANY
      allowedPluginFunctions = allowedPluginFunctions.filter(
        (fn) => fn.getName() === toolCallBehavior.getRequiredFunction().getName()
      )
    } else {
      const enabledKernelFunctions: AllowedKernelFunctions =
        toolCallBehavior as AllowedKernelFunctions

      allowedPluginFunctions = allowedPluginFunctions.filter(
        (fn) =>
          enabledKernelFunctions.isAllKernelFunctionsAllowed() ??
          enabledKernelFunctions.isFunctionAllowed(fn.getPluginName(), fn.getName())
      )
    }

    const functionDeclarations = allowedPluginFunctions.map((kernelFunction) =>
      GeminiChatCompletion.buildFunctionDeclaration(kernelFunction)
    )

    const toolConfig: ToolConfig = {
      functionCallingConfig: {
        mode,
        allowedFunctionNames:
          mode === FunctionCallingConfigMode.ANY
            ? functionDeclarations.map((d) => d.name ?? "").filter(Boolean)
            : undefined,
      },
    }

    return {
      functionDeclarations,
      toolConfig,
    }
  }

  getGeminiChatMessageContentFromResponse(
    response: GenerateContentResponse
  ): GeminiChatMessageContent<any> {
    let message = ""
    const functionCalls: GeminiFunctionCallContent[] = []

    response.candidates?.forEach((candidate) => {
      const content = candidate.content
      if (!content?.parts?.length) {
        return
      }

      content.parts.forEach((part) => {
        if (part.functionCall?.name) {
          functionCalls.push(new GeminiFunctionCallContent(part.functionCall)) // an Unexecuted function
        }

        if (part.text) {
          message = message + part.text
        }
      })
    })

    const metadata = FunctionResultMetadata.build<GenerateContentResponse["usageMetadata"]>(
      uuidv4(),
      response.usageMetadata,
      response.createTime ? new Date(response.createTime).getTime() : new Date().getTime()
    )

    return new GeminiChatMessageContent<unknown>(
      AuthorRole.ASSISTANT,
      message,
      undefined,
      undefined,
      undefined,
      metadata,
      functionCalls
    )
  }

  static buildFunctionDeclaration(kernelFunction: KernelFunction<any>): FunctionDeclaration {
    return GeminiFunction.toFunctionDeclaration(
      kernelFunction.getMetadata(),
      kernelFunction.getPluginName()
    )
  }
}

/**
 * Builder for creating a new instance of {@link GeminiChatCompletion}.
 */
class GeminiChatCompletionBuilder extends AIServiceBuilder<
  GoogleGenAI,
  GeminiChatCompletion,
  GeminiChatCompletionBuilder
> {
  public build(): GeminiChatCompletion {
    if (!this.client || !this.modelId) {
      throw new AIException(AIException.ErrorCodes.INVALID_REQUEST)
    }

    if (!this.deploymentName) {
      Logger.debug("Deployment name is not provided, using model id as deployment name")
      this.deploymentName = this.modelId
    }

    return new GeminiChatCompletion(this.client, this.deploymentName, this.modelId, this.serviceId)
  }
}
