import { concatMap, last, map, Observable } from "rxjs"
import { v4 as uuid4 } from "uuid"
import SKException from "../exceptions/SKException"
import { FunctionInvokedEvent, FunctionInvokingEvent } from "../hooks/FnInvokeEvents"
import KernelHooks from "../hooks/KernelHooks"
import { PromptRenderedEvent, PromptRenderingEvent } from "../hooks/PromptEvents"
import Kernel from "../Kernel"
import { Logger } from "../log/Logger"
import ExecutionSettingsForService from "../orchestration/ExecutionSettingsForService"
import FunctionResult from "../orchestration/FunctionResult"
import InvocationContext from "../orchestration/InvocationContext"
import PromptExecutionSettings from "../orchestration/PromptExecutionSettings"
import { ChatCompletionService } from "../services/chatcompletion/ChatCompletionService"
import { TextGenerationService } from "../services/textcompletion/TextGenerationService"
import { TextAIServiceKeyStub } from "../services/types/TextAIService"
import DefaultOriginalInstance from "./DefaultOriginalInstance"
import HandlebarsPromptTemplateFactory from "./HandlebarsPromptTemplateFactory"
import InputVariable from "./InputVariable"
import KernelArguments from "./KernelArguments"
import KernelFunction from "./KernelFunction"
import KernelFunctionMetadata from "./KernelFunctionMetadata"
import KernelPromptTemplateFactory from "./KernelPromptTemplateFactory"
import OutputVariable from "./OutputVariable"
import { PromptTemplate } from "./prompttemplate/PromptTemplate"
import PromptTemplateConfig from "./prompttemplate/PromptTemplateConfig"
import { PromptTemplateFactory } from "./prompttemplate/PromptTemplateFactory"

export default class KernelFunctionFromPrompt<T> extends KernelFunction<T> {
  private LOGGER = Logger

  private template: PromptTemplate

  /**
   * Creates a new instance of {@link KernelFunctionFromPrompt}.
   *
   * @param template          the prompt template to use for the function
   * @param promptConfig      the configuration for the prompt
   * @param executionSettings the execution settings to use when invoking the function
   */
  constructor(
    template: PromptTemplate,
    promptConfig: PromptTemplateConfig,
    executionSettings: ExecutionSettingsForService
  ) {
    super(
      function m() {},
      new KernelFunctionMetadata<T>(
        "",
        promptConfig.getName() ?? uuid4(),
        promptConfig.getDescription() ?? "",
        promptConfig.getInputVariables(),
        promptConfig.getOutputVariable()
      ),
      new DefaultOriginalInstance(),
      executionSettings ?? promptConfig.getExecutionSettings()
    )
    this.template = template
  }

  static Builder<T>() {
    return new FromPromptBuilder<T>()
  }

  invokeAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): Observable<FunctionResult<T>> {
    const context = invocationContext || new InvocationContext()

    const kernelHooks = KernelHooks.merge(kernel.getGlobalKernelHooks(), context.getKernelHooks())

    const preRenderingHookState = kernelHooks.executeHooks(
      new PromptRenderingEvent(this, kernelArguments)
    )

    // preRenderHook
    const updatedArguments =
      preRenderingHookState?.getArguments() ?? kernelArguments ?? new KernelArguments()

    const rendered = this.template.renderAsync(kernel, updatedArguments, invocationContext).pipe(
      last(),
      concatMap((fnResult) => {
        const initialPrompt = fnResult.getResult()

        const promptHookResult = kernelHooks.executeHooks(
          new PromptRenderedEvent(this, updatedArguments, initialPrompt)
        )

        const prompt = promptHookResult.getPrompt()

        if (!prompt) {
          throw new SKException("no prompt returned after executing PromptRenderedHook")
        }

        let args = promptHookResult.getArguments()

        const fnInvokingEvent = kernelHooks.executeHooks(new FunctionInvokingEvent(this, args))

        args = KernelArguments.Builder()
          .withVariables(fnInvokingEvent.getArguments()!)
          .withExecutionSettingsMap(
            this.getExecutionSettings() ?? ExecutionSettingsForService.create()
          )
          .build()

        const aiServiceSelection = kernel
          .getServiceSelector()
          .trySelectAIService(TextAIServiceKeyStub, this, args)

        if (!aiServiceSelection) {
          throw new SKException(
            "Failed to initialise aiService, could not find any TextAIService implementations"
          )
        }

        const client = aiServiceSelection.getService()

        let result

        const executionSettings = aiServiceSelection.getSettings()

        let contextWithExecutionSettings = context
        if (!context.getPromptExecutionSettings()) {
          contextWithExecutionSettings = InvocationContext.copy(context)
            .withPromptExecutionSettings(executionSettings)
            .build()
        }

        if (client instanceof ChatCompletionService) {
          result = client
            .getChatMessageContentsAsync(prompt, kernel, contextWithExecutionSettings)
            .pipe(
              map((chatMessageContent) => {
                const fnRes = new FunctionResult(chatMessageContent) as FunctionResult<T>
                const updatedResult = kernelHooks.executeHooks(
                  new FunctionInvokedEvent(this, args, fnRes)
                )
                return updatedResult.getResult()
              })
            )
        } else if (client instanceof TextGenerationService) {
          result = client
            .getTextContentsAsync(
              prompt,
              kernel,
              contextWithExecutionSettings.getPromptExecutionSettings()
            )
            .pipe(
              map((textContent) => {
                const fnRes = new FunctionResult(textContent) as FunctionResult<T>
                const updatedResult = kernelHooks.executeHooks(
                  new FunctionInvokedEvent(this, args, fnRes)
                )
                return updatedResult.getResult()
              })
            )
        } else {
          throw new SKException("Unknown service type")
        }

        return result
      })
    )

    return rendered
  }
}

export class FromPromptBuilder<T> {
  private promptTemplate: PromptTemplate | undefined

  private name: string | undefined

  private executionSettings: ExecutionSettingsForService | undefined

  private description: string | undefined

  private inputVariables: InputVariable[] | undefined

  private template: string | undefined

  private templateFormat: string | undefined

  private outputVariable: OutputVariable<any> | undefined

  private promptTemplateFactory: PromptTemplateFactory | undefined

  private promptTemplateConfig: PromptTemplateConfig | undefined

  withName(name: string): this {
    this.name = name

    return this
  }

  withInputParameters(inputVariables: InputVariable[]): this {
    this.inputVariables = Array.from(inputVariables)

    return this
  }

  withPromptTemplate(promptTemplate: PromptTemplate): this {
    this.promptTemplate = promptTemplate

    return this
  }

  withExecutionSettings(executionSettings: ExecutionSettingsForService): this {
    this.executionSettings = executionSettings

    return this
  }

  withDefaultExecutionSettings(executionSettings: PromptExecutionSettings) {
    if (!this.executionSettings) {
      this.executionSettings = ExecutionSettingsForService.create()
    }

    this.executionSettings.set(PromptExecutionSettings.DEFAULT_SERVICE_ID, executionSettings)

    if (executionSettings.getServiceId()) {
      this.executionSettings.set(executionSettings.getServiceId(), executionSettings)
    }

    return this
  }

  withDescription(description: string): this {
    this.description = description

    return this
  }

  withTemplate(template: string): this {
    this.template = template

    return this
  }

  withOutputVariable<U>(outputVariable: OutputVariable<U>): this {
    this.outputVariable = outputVariable
    return this
  }

  withPromptTemplateFactory(promptTemplateFactory: PromptTemplateFactory): this {
    this.promptTemplateFactory = promptTemplateFactory
    return this
  }

  withPromptTemplateConfig(promptTemplateConfig: PromptTemplateConfig): this {
    this.promptTemplateConfig = promptTemplateConfig
    return this
  }

  build(): KernelFunction<T> {
    this.executionSettings = this.executionSettings ?? ExecutionSettingsForService.create()

    this.templateFormat =
      this.templateFormat ?? HandlebarsPromptTemplateFactory.HANDLEBARS_TEMPLATE_FORMAT

    this.name = this.name ?? uuid4()

    this.promptTemplateFactory = this.promptTemplateFactory ?? new KernelPromptTemplateFactory()

    if (this.promptTemplateConfig) {
      if (!this.promptTemplate) {
        this.promptTemplate = this.promptTemplateFactory.tryCreate(this.promptTemplateConfig)
      }

      return new KernelFunctionFromPrompt(
        this.promptTemplate!,
        this.promptTemplateConfig,
        this.executionSettings
      )
    }

    const config = new PromptTemplateConfig({
      name: this.name,
      template: this.template,
      templateFormat: this.templateFormat,
      promptTemplateOptions: new Set(),
      description: this.description,
      inputVariables: this.inputVariables,
      outputVariable: this.outputVariable,
      executionSettings: this.executionSettings,
    })

    return new KernelFunctionFromPrompt<T>(
      this.promptTemplate ?? new KernelPromptTemplateFactory().tryCreate(config),
      config,
      this.executionSettings
    )
  }
}
