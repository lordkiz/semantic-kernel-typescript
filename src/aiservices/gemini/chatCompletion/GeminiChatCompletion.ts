import {
  Content,
  createPartFromFunctionResponse,
  FunctionCall,
  FunctionDeclaration,
  GenerateContentConfig,
  GenerateContentParameters,
  GenerateContentResponse,
  GoogleGenAI,
  Tool,
} from "@google/genai"
import { Kernel } from "@semantic-kernel-typescript/core"
import { AIServiceBuilder } from "@semantic-kernel-typescript/core/builders"
import { AIException, SKException } from "@semantic-kernel-typescript/core/exceptions"
import { KernelArguments, KernelFunction } from "@semantic-kernel-typescript/core/functions"
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
  ChatHistory,
  ChatMessageContent,
  StreamingChatContent,
  TextAIService,
} from "@semantic-kernel-typescript/core/services"
import { from, mergeMap, Observable, throwError } from "rxjs"
import { v4 as uuidv4 } from "uuid"
import { GeminiService } from "../GeminiService"
import GeminiChatMessageContent from "./GeminiChatMessageContent"
import GeminiFunction from "./GeminiFunction"
import GeminiFunctionCallContent from "./GeminiFunctionCallContent"
import GeminiStreamingChatMessageContent from "./GeminiStreamingChatMessageContent"
import { GeminiXMLPromptParser } from "./GeminiXMLPromptParser"

export default class GeminiChatCompletion extends GeminiService implements ChatCompletionService {
  constructor(client: GoogleGenAI, modelId: string, deploymentName?: string, serviceId?: string) {
    super(client, modelId, deploymentName, serviceId)
  }

  static Builder() {
    return new GeminiChatCompletionBuilder()
  }

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
      new ChatHistory(chatHistory.getMessages()),
      new ChatHistory(),
      kernel,
      invocationContext ?? InvocationContext.Builder().build(),
      Math.min(
        TextAIService.MAXIMUM_INFLIGHT_AUTO_INVOKES,
        invocationContext?.getToolCallBehavior()?.getMaximumAutoInvokeAttempts() ?? 0
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
              content.getAuthorRole(),
              content.getContent(),
              this.modelId,
              content.getInnerContent(),
              content.getEncoding(),
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
    const fns: GeminiFunction[] = []
    if (kernel) {
      kernel.getPlugins().forEach((plugin) => {
        plugin.getFunctions().forEach((kernelFunction) => {
          fns.push(
            GeminiFunction.build(kernelFunction.getMetadata(), kernelFunction.getPluginName())
          )
        })
      })
    }

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
    const fns: GeminiFunction[] = []
    if (kernel) {
      kernel.getPlugins().forEach((plugin) => {
        plugin.getFunctions().forEach((kernelFunction) => {
          fns.push(
            GeminiFunction.build(kernelFunction.getMetadata(), kernelFunction.getPluginName())
          )
        })
      })
    }

    const contents = this.getContents(fullHistory)
    const config = this.getConfig(kernel, invocationContext)
    const generateContentResponse = await this.client.models.generateContent({
      model: this.modelId,
      config,
      contents,
    })

    const geminiChatMessageContent =
      this.getGeminiChatMessageContentFromResponse(generateContentResponse)

    fullHistory.addChatMessageContent(geminiChatMessageContent)
    newHistory.addChatMessageContent(geminiChatMessageContent)

    if (invocationAttempts <= 0 || !generateContentResponse.functionCalls?.length) {
      if (invocationContext.returnMode() === InvocationReturnMode.FULL_HISTORY) {
        return fullHistory.getMessages()
      }

      if (invocationContext.returnMode() === InvocationReturnMode.LAST_MESSAGE_ONLY) {
        const lastMessage = new ChatHistory()
        lastMessage.addChatMessageContent(geminiChatMessageContent)
        return lastMessage.getMessages()
      }

      return newHistory.getMessages()
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
        AuthorRole.USER,
        "",
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

    const settings = invocationContext.getPromptExecutionSettings()
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
      config: Object.assign(invocationContext.getPromptExecutionSettings() ?? {}),
    }
  }

  private getContents(chatHistory: ChatHistory): Content[] {
    const contents: Content[] = []

    chatHistory.getMessages().forEach((chatMessageContent) => {
      const content: Content = {}

      if (chatMessageContent.getAuthorRole() === AuthorRole.USER) {
        content.role = AuthorRole.USER

        if (chatMessageContent instanceof GeminiChatMessageContent) {
          const fns = GeminiFunctionCallContent.getFunctionTools(chatMessageContent)

          fns.forEach((geminiFunctionCall) => {
            const functionResult = geminiFunctionCall.functionResult

            if (!functionResult || !functionResult?.getResult()) {
              throw new SKException("Gemini failed to return a result")
            }

            if (!geminiFunctionCall.id) {
              throw new SKException(`No id found on gemini function ${geminiFunctionCall.fullName}`)
            }

            const part = createPartFromFunctionResponse(
              geminiFunctionCall.id,
              geminiFunctionCall.fullName,
              { result: functionResult.getResult() }
            )

            content.parts = [...(content.parts ?? []), part]
          })
        }
      } else if (chatMessageContent.getAuthorRole() === AuthorRole.ASSISTANT) {
        content.role = AuthorRole.MODEL

        if (chatMessageContent instanceof GeminiChatMessageContent) {
          ;((chatMessageContent.getItems() ?? []) as GeminiFunctionCallContent[]).forEach(
            (geminiFunctionCall) => {
              content.parts = [
                ...(content.parts ?? []),
                { functionCall: geminiFunctionCall.functionCall },
              ]
            }
          )
        }
      }

      if (chatMessageContent.getContent()) {
        content.parts = [...(content.parts ?? []), { text: chatMessageContent.getContent() }]
      }

      contents.push(content)
    })

    return contents
  }

  private getConfig(kernel: Kernel, invocationContext: InvocationContext<GenerateContentConfig>) {
    const config: GenerateContentConfig = Object.assign(
      invocationContext.getPromptExecutionSettings() ?? {}
    )

    if (invocationContext.getToolCallBehavior()) {
      const tool = this.getTool(kernel, invocationContext.getToolCallBehavior()!)

      if (tool) {
        config.tools = [...(config.tools ?? []), tool]
      }
    }

    return config
  }

  private getTool(kernel: Kernel, toolCallBehavior: ToolCallBehavior): Tool {
    const tool: Tool = { functionDeclarations: [] }
    if (toolCallBehavior instanceof RequiredKernelFunction) {
      const kernelFunction = toolCallBehavior.getRequiredFunction()
      tool.functionDeclarations = [
        ...(tool.functionDeclarations ?? []),
        GeminiChatCompletion.buildFunctionDeclaration(kernelFunction),
      ]
    }

    if (toolCallBehavior instanceof AllowedKernelFunctions) {
      kernel.getPlugins().forEach((plugin) => {
        plugin.getFunctions().forEach((kernelFunction) => {
          if (
            toolCallBehavior.isAllKernelFunctionsAllowed() ||
            toolCallBehavior.isKernelFunctionAllowed(kernelFunction)
          ) {
            tool.functionDeclarations = [
              ...(tool.functionDeclarations ?? []),
              GeminiChatCompletion.buildFunctionDeclaration(kernelFunction),
            ]
          }
        })
      })
    }

    return tool
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
          functionCalls.push(new GeminiFunctionCallContent(part.functionCall))
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
    const funcDecalration: FunctionDeclaration = {
      name: ToolCallBehavior.formFullFunctionName(
        kernelFunction.getPluginName(),
        kernelFunction.getName()
      ),
      description: kernelFunction.getDescription(),
    }

    const parameters = kernelFunction.getMetadata().getParameters()
    if (parameters && parameters.length) {
      const schema = [...parameters].reduce((a, c) => ({ ...a, ...c.toJsonSchema() }), {})
      funcDecalration.parameters = schema
    }

    return funcDecalration
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
