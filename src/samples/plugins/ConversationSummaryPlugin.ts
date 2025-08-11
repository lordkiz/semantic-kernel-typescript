import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunction,
  KernelFunctionFactory,
} from "@semantic-kernel-typescript/core/functions"
import { DefineKernelFunction } from "@semantic-kernel-typescript/core/functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "@semantic-kernel-typescript/core/functions/decorators/KernelFunctionParameter"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { ServiceClass } from "@semantic-kernel-typescript/core/services/types/AIServiceSelector"
import { TextChunker } from "@semantic-kernel-typescript/core/text"
import { mergeMap, Observable, of, reduce } from "rxjs"
import { PromptFunctionConstants } from "./PromptFunctionConstants"

export class ConversationSummaryPlugin {
  private summarizeConversationFunction: KernelFunction<string>
  private conversationActionItemsFunction: KernelFunction<string>
  private conversationTopicsFunction: KernelFunction<string>
  private promptExecutionSettings: PromptExecutionSettings
  private maxTokens: number = 1024

  private serviceClass: ServiceClass<any>

  constructor(
    service: ServiceClass<any>,
    promptExecutionSettings: PromptExecutionSettings,
    /** The max tokens to process in a single prompt function call.  */
    maxTokens?: number
  ) {
    this.serviceClass = service
    this.promptExecutionSettings = promptExecutionSettings

    if (maxTokens) {
      this.maxTokens = maxTokens
    }

    this.summarizeConversationFunction = KernelFunctionFactory.createFromPrompt<string>(
      PromptFunctionConstants.SummarizeConversationDefinition
    )
      .withExecutionSettings(this.promptExecutionSettings)
      .withName("summarizeConversation")
      .withDescription(
        "Given a section of a conversation transcript, summarize the part of the conversation."
      )
      .build()

    this.conversationActionItemsFunction = KernelFunctionFactory.createFromPrompt<string>(
      PromptFunctionConstants.GetConversationActionItemsDefinition
    )
      .withExecutionSettings(promptExecutionSettings)
      .withName("conversationActionItems")
      .withDescription("Given a section of a conversation transcript, identify action items.")
      .build()

    this.conversationTopicsFunction = KernelFunctionFactory.createFromPrompt<string>(
      PromptFunctionConstants.GetConversationTopicsDefinition
    )
      .withExecutionSettings(promptExecutionSettings)
      .withName("conversationTopics")
      .withDescription(
        "Analyze a conversation transcript and extract key topics worth remembering."
      )
      .build()
  }

  private processAsync(
    func: KernelFunction<string>,
    input: string,
    kernel: Kernel
  ): Observable<string> {
    const lines: string[] = TextChunker.splitPlainTextLines(input, this.maxTokens)
    const paragraphs: string[] = TextChunker.splitPlainTextParagraphs(lines, this.maxTokens)

    return of(paragraphs).pipe(
      mergeMap((paragraph) => {
        return func
          .invokeAsync(
            kernel,
            KernelArguments.Builder().withInput(paragraph).build(),
            InvocationContext.Builder().withServiceClass(this.serviceClass).build()
          )
          .pipe(reduce((acc, val) => acc + "\n" + val.result, ""))
      })
    )
  }

  /**
   * Given a long conversation transcript, summarize the conversation.
   * @param input - A long conversation transcript.
   * @param kernel - The Kernel containing services, plugins, and other state for use throughout the operation.
   * @returns Observable<string>
   */
  @DefineKernelFunction({
    description: "Given a long conversation transcript, summarize the conversation.",
    name: "SummarizeConversationAsync",
  })
  public SummarizeConversationAsync(
    @KernelFunctionParameter({ description: "A long conversation transcript.", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Kernel to use", name: "kernel" })
    kernel: Kernel
  ): Observable<string> {
    return this.processAsync(this.summarizeConversationFunction, input, kernel)
  }

  /**
   * Given a long conversation transcript, identify action items.
   * @param input - A long conversation transcript.
   * @param kernel - The Kernel containing services, plugins, and other state for use throughout the operation.
   * @returns Observable<string>
   */
  @DefineKernelFunction({
    description: "Given a long conversation transcript, identify action items.",
    name: "GetConversationActionItemsAsync",
  })
  public GetConversationActionItemsAsync(
    @KernelFunctionParameter({ description: "A long conversation transcript.", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Kernel to use", name: "kernel" })
    kernel: Kernel
  ): Observable<string> {
    return this.processAsync(this.conversationActionItemsFunction, input, kernel)
  }

  /**
   * Given a long conversation transcript, identify topics.
   * @param input - A long conversation transcript.
   * @param kernel - The Kernel containing services, plugins, and other state for use throughout the operation.
   * @returns Observable<string>
   */
  @DefineKernelFunction({
    description: "Given a long conversation transcript, identify topics worth remembering.",
    name: "GetConversationTopicsAsync",
  })
  public GetConversationTopicsAsync(
    @KernelFunctionParameter({ description: "A long conversation transcript.", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Kernel to use", name: "kernel" })
    kernel: Kernel
  ): Observable<string> {
    return this.processAsync(this.conversationTopicsFunction, input, kernel)
  }
}
