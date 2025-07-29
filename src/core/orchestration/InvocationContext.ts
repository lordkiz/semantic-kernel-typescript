import SemanticKernelBuilder from "../builders/SemanticKernelBuilder"
import SKException from "../exceptions/SKException"
import FunctionChoiceBehavior from "../functionchoice/FunctionChoiceBehavior"
import KernelHooks, { UnmodifiableKernelHooks } from "../hooks/KernelHooks"
import SemanticKernelTelemetry from "../implementations/telemetry/SemanticKernelTelemetry"
import { InvocationReturnMode } from "./InvocationReturnMode"
import PromptExecutionSettings from "./PromptExecutionSettings"
import ToolCallBehavior from "./ToolCallBehavior"

export default class InvocationContext<
  ExecutionConfig extends Record<string, any> = Record<string, any>,
> {
  private _hooks: UnmodifiableKernelHooks | undefined

  private _promptExecutionSettings: PromptExecutionSettings<ExecutionConfig> | undefined

  private _toolCallBehavior: ToolCallBehavior | undefined

  private _functionChoiceBehavior: FunctionChoiceBehavior | undefined

  private _telemetry: SemanticKernelTelemetry | undefined

  private _invocationReturnMode: InvocationReturnMode

  constructor(
    hooks?: KernelHooks,
    promptExecutionSettings?: PromptExecutionSettings<ExecutionConfig>,
    toolCallBehavior?: ToolCallBehavior,
    functionChoiceBehavior?: FunctionChoiceBehavior,
    invocationReturnMode?: InvocationReturnMode,
    telemetry?: SemanticKernelTelemetry
  ) {
    this._hooks = hooks
    this._promptExecutionSettings = promptExecutionSettings
    this._toolCallBehavior = toolCallBehavior
    this._functionChoiceBehavior = functionChoiceBehavior
    this._invocationReturnMode = invocationReturnMode || InvocationReturnMode.NEW_MESSAGES_ONLY
    this._telemetry = telemetry
  }

  static clone(invocationContext: InvocationContext<any>): InvocationContext<any> {
    return new InvocationContext(
      UnmodifiableKernelHooks.construct(invocationContext.kernelHooks),
      invocationContext.promptExecutionSettings,
      invocationContext.toolCallBehavior,
      invocationContext.functionChoiceBehavior,
      invocationContext.returnMode,
      invocationContext.telemetry
    )
  }

  /**
   * Create a new instance of InvocationContext by copying the values from another instance.
   *
   * @param context The context to copy.
   * @return The new instance of InvocationContext.
   */
  static copy(context: InvocationContext<any>): InvocationContextBuilder<any> {
    return new InvocationContextBuilder()
      .withKernelHooks(context.kernelHooks)
      .withPromptExecutionSettings(context.promptExecutionSettings)
      .withToolCallBehavior(context.toolCallBehavior)
      .withTelemetry(context.telemetry)
  }

  clone(): InvocationContext<ExecutionConfig> {
    return InvocationContext.clone(this)
  }

  get kernelHooks() {
    return this._hooks
  }

  get promptExecutionSettings() {
    return this._promptExecutionSettings
  }

  get toolCallBehavior() {
    return this._toolCallBehavior
  }

  get functionChoiceBehavior() {
    return this._functionChoiceBehavior
  }

  get returnMode() {
    return this._invocationReturnMode
  }

  get telemetry() {
    return this._telemetry
  }

  static unmodifiableClone(kernelHooks?: KernelHooks): UnmodifiableKernelHooks | undefined {
    if (kernelHooks instanceof UnmodifiableKernelHooks) {
      return kernelHooks
    } else if (kernelHooks) {
      return kernelHooks.unmodifiableClone()
    }
  }

  static Builder<
    ExecutionConfig extends Record<string, any> = Record<string, any>,
  >(): InvocationContextBuilder<ExecutionConfig> {
    return new InvocationContextBuilder()
  }
}

class InvocationContextBuilder<ExecutionConfig extends Record<string, any> = Record<string, any>>
  implements SemanticKernelBuilder<InvocationContext<ExecutionConfig>>
{
  private hooks: UnmodifiableKernelHooks | undefined

  private promptExecutionSettings: PromptExecutionSettings<ExecutionConfig> | undefined

  private toolCallBehavior: ToolCallBehavior | undefined

  private functionChoiceBehavior: FunctionChoiceBehavior | undefined

  private telemetry: SemanticKernelTelemetry | undefined

  private invocationReturnMode: InvocationReturnMode = InvocationReturnMode.NEW_MESSAGES_ONLY

  /**
   * Add kernel hooks to the builder.
   *
   * @param hooks the hooks to add.
   * @return this {@link InvocationContextBuilder}
   */
  withKernelHooks(hooks?: KernelHooks) {
    if (!hooks) {
      return this
    }
    this.hooks = InvocationContext.unmodifiableClone(hooks)
    return this
  }

  /**
   * Add prompt execution settings to the builder.
   *
   * @param promptExecutionSettings the settings to add.
   * @return this {@link InvocationContextBuilder}
   */
  withPromptExecutionSettings(promptExecutionSettings?: PromptExecutionSettings<ExecutionConfig>) {
    this.promptExecutionSettings = promptExecutionSettings
    return this
  }

  /**
   * Add tool call behavior to the builder.
   *
   * @param toolCallBehavior the behavior to add.
   * @return this {@link InvocationContextBuilder}
   */
  withToolCallBehavior(toolCallBehavior?: ToolCallBehavior) {
    if (toolCallBehavior && this.functionChoiceBehavior) {
      throw new SKException("ToolCallBehavior cannot be set when FunctionChoiceBehavior is set.")
    }
    this.toolCallBehavior = toolCallBehavior
    return this
  }

  /**
   * Add function choice behavior to the builder.
   *
   * @param functionChoiceBehavior the behavior to add.
   * @return this {@link InvocationContextBuilder}
   */
  withFunctionChoiceBehavior(functionChoiceBehavior: FunctionChoiceBehavior) {
    if (functionChoiceBehavior != null && this.toolCallBehavior != null) {
      throw new SKException("FunctionChoiceBehavior cannot be set when ToolCallBehavior is set.")
    }
    this.functionChoiceBehavior = functionChoiceBehavior
    return this
  }

  /**
   * Set the return mode for the invocation.
   * <p>
   * Defaults to {@link InvocationReturnMode#NEW_MESSAGES_ONLY}.
   *
   * @param invocationReturnMode the return mode for the invocation.
   * @return this {@link InvocationContextBuilder}
   */
  withReturnMode(invocationReturnMode: InvocationReturnMode) {
    this.invocationReturnMode = invocationReturnMode
    return this
  }

  /**
   * Add a tracer to the builder.
   *
   * @param telemetry the tracer to add.
   * @return this {@link InvocationContextBuilder}
   */
  withTelemetry(telemetry?: SemanticKernelTelemetry) {
    this.telemetry = telemetry
    return this
  }

  build(): InvocationContext<ExecutionConfig> {
    if (!this.telemetry) {
      this.telemetry = new SemanticKernelTelemetry()
    }
    return new InvocationContext(
      this.hooks,
      this.promptExecutionSettings,
      this.toolCallBehavior,
      this.functionChoiceBehavior,
      this.invocationReturnMode,
      this.telemetry
    )
  }
}
