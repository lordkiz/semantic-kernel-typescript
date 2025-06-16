import SemanticKernelBuilder from "../builders/SemanticKernelBuilder";
import SKException from "../exceptions/SKException";
import FunctionChoiceBehavior from "../functionchoice/FunctionChoiceBehavior";
import KernelHooks, { UnmodifiableKernelHooks } from "../hooks/KernelHooks";
import SemanticKernelTelemetry from "../implementations/telemetry/SemanticKernelTelemetry";
import { InvocationReturnMode } from "./InvocationReturnMode";
import PromptExecutionSettings from "./PromptExecutionSettings";
import ToolCallBehavior from "./ToolCallBehavior";

export default class InvocationContext {
  private hooks: UnmodifiableKernelHooks | undefined;

  private promptExecutionSettings: PromptExecutionSettings | undefined;

  private toolCallBehavior: ToolCallBehavior | undefined;

  private functionChoiceBehavior: FunctionChoiceBehavior | undefined;

  private telemetry: SemanticKernelTelemetry | undefined;

  private invocationReturnMode: InvocationReturnMode;

  constructor(
    hooks?: KernelHooks,
    promptExecutionSettings?: PromptExecutionSettings,
    toolCallBehavior?: ToolCallBehavior,
    functionChoiceBehavior?: FunctionChoiceBehavior,
    invocationReturnMode?: InvocationReturnMode,
    telemetry?: SemanticKernelTelemetry
  ) {
    this.hooks = hooks;
    this.promptExecutionSettings = promptExecutionSettings;
    this.toolCallBehavior = toolCallBehavior;
    this.functionChoiceBehavior = functionChoiceBehavior;
    this.invocationReturnMode =
      invocationReturnMode || InvocationReturnMode.NEW_MESSAGES_ONLY;
    this.telemetry = telemetry;
  }

  static clone(invocationContext: InvocationContext): InvocationContext {
    return new InvocationContext(
      UnmodifiableKernelHooks.construct(invocationContext.getKernelHooks()),
      invocationContext.getPromptExecutionSettings(),
      invocationContext.getToolCallBehavior(),
      invocationContext.getFunctionChoiceBehavior(),
      invocationContext.invocationReturnMode,
      invocationContext.getTelemetry()
    );
  }

  clone(): InvocationContext {
    return InvocationContext.clone(this);
  }

  getKernelHooks() {
    return this.hooks;
  }

  getPromptExecutionSettings() {
    return this.promptExecutionSettings;
  }

  getToolCallBehavior() {
    return this.toolCallBehavior;
  }

  getFunctionChoiceBehavior() {
    return this.functionChoiceBehavior;
  }

  returnMode() {
    return this.invocationReturnMode;
  }

  getTelemetry() {
    return this.telemetry;
  }

  static unmodifiableClone(
    kernelHooks?: KernelHooks
  ): UnmodifiableKernelHooks | undefined {
    if (kernelHooks instanceof UnmodifiableKernelHooks) {
      return kernelHooks;
    } else if (!!kernelHooks) {
      return kernelHooks.unmodifiableClone();
    }
  }

  static Builder(): InvocationContextBuilder {
    return new InvocationContextBuilder();
  }
}

class InvocationContextBuilder
  implements SemanticKernelBuilder<InvocationContext>
{
  private hooks: UnmodifiableKernelHooks | undefined;

  private promptExecutionSettings: PromptExecutionSettings | undefined;

  private toolCallBehavior: ToolCallBehavior | undefined;

  private functionChoiceBehavior: FunctionChoiceBehavior | undefined;

  private telemetry: SemanticKernelTelemetry | undefined;

  private invocationReturnMode: InvocationReturnMode =
    InvocationReturnMode.NEW_MESSAGES_ONLY;

  /**
   * Add kernel hooks to the builder.
   *
   * @param hooks the hooks to add.
   * @return this {@link InvocationContextBuilder}
   */
  withKernelHooks(hooks: KernelHooks) {
    this.hooks = InvocationContext.unmodifiableClone(hooks);
    return this;
  }

  /**
   * Add prompt execution settings to the builder.
   *
   * @param promptExecutionSettings the settings to add.
   * @return this {@link InvocationContextBuilder}
   */
  withPromptExecutionSettings(
    promptExecutionSettings: PromptExecutionSettings
  ) {
    this.promptExecutionSettings = promptExecutionSettings;
    return this;
  }

  /**
   * Add tool call behavior to the builder.
   *
   * @param toolCallBehavior the behavior to add.
   * @return this {@link InvocationContextBuilder}
   */
  withToolCallBehavior(toolCallBehavior: ToolCallBehavior) {
    if (toolCallBehavior != null && this.functionChoiceBehavior != null) {
      throw new SKException(
        "ToolCallBehavior cannot be set when FunctionChoiceBehavior is set."
      );
    }
    this.toolCallBehavior = toolCallBehavior;
    return this;
  }

  /**
   * Add function choice behavior to the builder.
   *
   * @param functionChoiceBehavior the behavior to add.
   * @return this {@link InvocationContextBuilder}
   */
  withFunctionChoiceBehavior(functionChoiceBehavior: FunctionChoiceBehavior) {
    if (functionChoiceBehavior != null && this.toolCallBehavior != null) {
      throw new SKException(
        "FunctionChoiceBehavior cannot be set when ToolCallBehavior is set."
      );
    }
    this.functionChoiceBehavior = functionChoiceBehavior;
    return this;
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
    this.invocationReturnMode = invocationReturnMode;
    return this;
  }

  /**
   * Add a tracer to the builder.
   *
   * @param telemetry the tracer to add.
   * @return this {@link InvocationContextBuilder}
   */
  withTelemetry(telemetry: SemanticKernelTelemetry) {
    this.telemetry = telemetry;
    return this;
  }

  build(): InvocationContext {
    if (!this.telemetry == null) {
      this.telemetry = new SemanticKernelTelemetry();
    }
    return new InvocationContext(
      this.hooks,
      this.promptExecutionSettings,
      this.toolCallBehavior,
      this.functionChoiceBehavior,
      this.invocationReturnMode,
      this.telemetry
    );
  }
}
