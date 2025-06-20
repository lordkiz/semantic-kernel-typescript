import {
  lastValueFrom,
  Observable,
  Observer,
  PartialObserver,
  Subscription,
} from "rxjs";
import FunctionResult from "./FunctionResult";
import KernelFunction from "../functions/KernelFunction";
import KernelArguments from "../functions/KernelArguments";
import KernelHooks, { UnmodifiableKernelHooks } from "../hooks/KernelHooks";
import PromptExecutionSettings from "./PromptExecutionSettings";
import ToolCallBehavior from "./ToolCallBehavior";
import { KernelHook } from "../hooks/KernelHook";
import SKException from "../exceptions/SKException";
import InvocationContext from "./InvocationContext";
import FunctionChoiceBehavior from "../functionchoice/FunctionChoiceBehavior";
import SemanticKernelTelemetry from "../implementations/telemetry/SemanticKernelTelemetry";
import { Logger } from "../log/Logger";
import Kernel from "../Kernel";
import { InvocationReturnMode } from "./InvocationReturnMode";
import {
  KernelFunctionParameterMetadata,
  NO_DEFAULT_VALUE,
} from "../functions/decorators/KernelFunctionParameter";
import { KERNEL_FUNCTION_PARAMETER_METADATA_KEY } from "../functions/decorators/constants";
import ContextVariable from "../variables/ContextVariable";

type FunctionInvocationObserver<T> =
  | Partial<Observer<FunctionResult<T>>>
  | ((value: FunctionResult<T>) => void)
  | null
  | undefined;

export default class FunctionInvocation<T> extends Observable<
  FunctionResult<T>
> {
  protected fn: KernelFunction<T>;
  protected kernel: Kernel;
  protected kernelArguments: KernelArguments | undefined;
  protected hooks: UnmodifiableKernelHooks | undefined;
  protected promptExecutionSettings: PromptExecutionSettings | undefined;
  protected toolCallBehavior: ToolCallBehavior | undefined;
  protected functionChoiceBehavior: FunctionChoiceBehavior | undefined;
  protected telemetry: SemanticKernelTelemetry | undefined;

  private isSubscribed: boolean = false;

  private LOGGER = Logger;

  constructor(kernel: Kernel, fn: KernelFunction<T>) {
    super();
    this.fn = fn;
    this.kernel = kernel;
    this.addKernelHooks(kernel.getGlobalKernelHooks());
  }

  private static unmodifiableClone(
    kernelHooks?: KernelHooks
  ): UnmodifiableKernelHooks | undefined {
    if (kernelHooks instanceof UnmodifiableKernelHooks) {
      return kernelHooks;
    } else if (!!kernelHooks) {
      return kernelHooks.unmodifiableClone();
    }
  }

  private static performSubscribe<T>(
    observer: FunctionInvocationObserver<T>,
    kernel: Kernel,
    kernelFunction: KernelFunction<T>,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): Subscription {
    const contextClone = invocationContext?.clone();

    return kernelFunction
      .invokeAsync(kernel, kernelArguments, contextClone)
      .subscribe(observer);
  }

  /**
   * Supply arguments to the function invocation.
   *
   * @param kernelArguments The arguments to supply to the function invocation.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  withArguments(kernelArguments: KernelArguments) {
    this.kernelArguments = KernelArguments.Builder()
      .withVariables(kernelArguments)
      .build();
    return this;
  }

  /**
   * Add a kernel hook to the function invocation.
   *
   * @param hook The kernel hook to add.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  addKernelHook(hook?: KernelHook<any>) {
    if (!hook) return this;

    const clone = new KernelHooks(this.hooks as KernelHooks);
    clone.addHook(hook);
    this.hooks = clone.unmodifiableClone();
    return this;
  }

  /**
   * Add kernel hooks to the function invocation.
   *
   * @param hooks The kernel hooks to add.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  addKernelHooks(hooks?: KernelHooks) {
    if (!hooks) return this;

    const clone = new KernelHooks(this.hooks as KernelHooks);
    clone.addHooks(hooks);
    this.hooks = clone.unmodifiableClone();
    return this;
  }

  /**
   * Supply prompt execution settings to the function invocation.
   *
   * @param promptExecutionSettings The prompt execution settings to supply to the function
   *                                invocation.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  withPromptExecutionSettings(
    promptExecutionSettings?: PromptExecutionSettings
  ) {
    this.promptExecutionSettings = promptExecutionSettings;
    return this;
  }

  /**
   * Supply tool call behavior to the function invocation.
   *
   * @param toolCallBehavior The tool call behavior to supply to the function invocation.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  withToolCallBehavior(toolCallBehavior?: ToolCallBehavior) {
    if (toolCallBehavior && !this.functionChoiceBehavior) {
      throw new SKException(
        "ToolCallBehavior cannot be set when FunctionChoiceBehavior is set."
      );
    }
    this.toolCallBehavior = toolCallBehavior;
    return this;
  }

  /**
   * Supply function choice behavior to the function invocation.
   *
   * @param functionChoiceBehavior The function choice behavior to supply to the function
   *                               invocation.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  withFunctionChoiceBehavior(functionChoiceBehavior: FunctionChoiceBehavior) {
    if (functionChoiceBehavior && this.toolCallBehavior) {
      throw new SKException(
        "FunctionChoiceBehavior cannot be set when ToolCallBehavior is set."
      );
    }
    this.functionChoiceBehavior = functionChoiceBehavior;
    return this;
  }

  /**
   * Supply a tracer to the function invocation.
   *
   * @param tracer The tracer to supply to the function invocation.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  withTelemetry(telemetry: SemanticKernelTelemetry) {
    this.telemetry = telemetry;
    return this;
  }

  /**
   * Use an invocation context variable to supply the types, tool call behavior, prompt execution
   * settings, and kernel hooks to the function invocation.
   *
   * @param invocationContext The invocation context to supply to the function invocation.
   * @return this {@code FunctionInvocation} for fluent chaining.
   */
  withInvocationContext(invocationContext?: InvocationContext) {
    if (!invocationContext) {
      return this;
    }

    // this.withTypes(invocationContext.getContextVariableTypes());

    const functionChoiceBehavior =
      invocationContext.getFunctionChoiceBehavior();
    if (functionChoiceBehavior) {
      this.withFunctionChoiceBehavior(functionChoiceBehavior);
    }

    this.withToolCallBehavior(invocationContext.getToolCallBehavior());

    this.withPromptExecutionSettings(
      invocationContext.getPromptExecutionSettings()
    );

    this.addKernelHooks(invocationContext.getKernelHooks());

    const telemetry = invocationContext.getTelemetry();
    if (telemetry) {
      this.withTelemetry(telemetry);
    }

    return this;
  }

  /**
   * This method handles the reactive stream when the KernelFunction is invoked.
   *
   * @param observer The subscriber to subscribe to the function invocation.
   */
  override subscribe(observer: FunctionInvocationObserver<T>): Subscription {
    if (this.isSubscribed) {
      this.LOGGER.warn(
        "function has already been subscribed to this is not necessarily an error but may be an unusual pattern"
      );
    }

    if (!this.telemetry) {
      this.telemetry = new SemanticKernelTelemetry();
    }

    this.isSubscribed = true;

    return FunctionInvocation.performSubscribe(
      observer,
      this.kernel,
      this.fn,
      this.kernelArguments,
      new InvocationContext(
        this.hooks,
        this.promptExecutionSettings,
        this.toolCallBehavior,
        this.functionChoiceBehavior,
        InvocationReturnMode.NEW_MESSAGES_ONLY,
        this.telemetry
      )
    );
  }

  public block() {
    return lastValueFrom(this);
  }
}
