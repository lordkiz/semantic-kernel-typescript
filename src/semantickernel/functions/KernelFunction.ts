import CaseInsensitiveMap from "../ds/CaseInsensitiveMap";
import SKException from "../exceptions/SKException";
import Kernel from "../Kernel";
import FunctionInvocation from "../orchestration/FunctionInvocation";
import FunctionResult from "../orchestration/FunctionResult";
import InvocationContext from "../orchestration/InvocationContext";
import PromptExecutionSettings from "../orchestration/PromptExecutionSettings";
import DefaultOriginalInstance from "./DefaultOriginalInstance";
import KernelArguments from "./KernelArguments";
import KernelFunctionMetadata from "./KernelFunctionMetadata";
import RXJS, { Observer } from "rxjs";
import _ from "lodash";
import KernelFunctionFromMethod from "./KernelFunctionFromMethod";

export default abstract class KernelFunction<T> {
  private method: Function;
  private readonly instance: InstanceType<any>;
  private metadata: KernelFunctionMetadata<T>;
  private executionSettings:
    | CaseInsensitiveMap<PromptExecutionSettings>
    | undefined;

  constructor(
    method: Function,
    metadata: KernelFunctionMetadata<T>,
    instance?: InstanceType<any>,
    executionSettings?:
      | Map<string, PromptExecutionSettings>
      | CaseInsensitiveMap<PromptExecutionSettings>
  ) {
    if (!method.name) {
      throw new SKException(
        "Anonymous functions are not valid as Kernel Functions"
      );
    }

    this.method = method;
    this.metadata = metadata;
    this.executionSettings = new CaseInsensitiveMap<PromptExecutionSettings>();

    const hasInstance = !!instance;
    if (!hasInstance) {
      const _instance: InstanceType<any> = new DefaultOriginalInstance();
      _instance[this.method.name] = this.method;
      this.instance = _instance;
    } else {
      this.instance = instance;
    }

    if (executionSettings) {
      this.executionSettings.putAll(
        executionSettings as CaseInsensitiveMap<PromptExecutionSettings>
      );
    }
  }

  /**
   * Creates a {@link KernelFunction} instance for a method, specified via a {@link Method}
   * instance
   *
   * @param <T>    The return type of the method.
   * @param method The method to be represented via the created {@link KernelFunction}.
   * @param target The target object for the {@code method} if it represents an instance method.
   *               This should be {@code null} if and only if {@code method} is a static method.
   * @return The created {@link KernelFunction} wrapper for {@code method}.
   */
  static createFromMethod<T>(method: Function, target: InstanceType<any>) {
    return KernelFunctionFromMethod.Builder<T>()
      .withMethod(method)
      .withTarget(target);
  }

  /**
   * Creates a {@link KernelFunction} instance based on a given prompt
   *
   * @param prompt The prompt to be used for the created {@link KernelFunction}.
   * @param <T>    The return type of the method
   * @return The builder for creating a {@link KernelFunction} instance.
   */
  // static createFromPrompt<T>(prompt: string): FromPromptBuilder<T> {
  //   return KernelFunctionFromPrompt.builder<T>().withTemplate(prompt);
  // }

  /**
   * Builder for creating a {@link KernelFunction} instance for a given
   * {@link PromptTemplateConfig}.
   *
   * @param promptTemplateConfiguration The configuration for the prompt template.
   * @param <T>                         The return type of the method
   * @return The builder for creating a {@link KernelFunction} instance.
   */
  // static createFromPrompt<T>(
  //   promptTemplateConfiguration: PromptTemplateConfig
  // ): FromPromptBuilder<T> {
  //   return KernelFunctionFromPrompt.builder<T>().withPromptTemplateConfig(
  //     promptTemplateConfiguration
  //   );
  // }

  /**
   * Get the plugin name of the function.
   * @return The name of the plugin that this function is within
   */
  public getPluginName() {
    return this.metadata.getPluginName();
  }

  /**
   * Get the name of the function.
   * @return The name of this function
   */
  public getName() {
    return this.metadata.getName();
  }

  /**
   * Get the description of the function.
   * @return A description of the function
   */
  public getDescription() {
    return this.metadata.getDescription();
  }

  /**
   * Get the instance that the method of this Kernel Function is defined on.
   * Note: Multiple Kernel Functions can reference the same instance
   * @returns A Proxy of the original instance
   */
  getInstance() {
    return new Proxy(_.cloneDeep(this.instance), {
      apply(target, _thisArg, argumentsList) {
        return new target(...argumentsList);
      },
    });
  }

  getMethod() {
    return this.method;
  }

  /**
   * Get an unmodifiable map of the execution settings for the function.
   *
   * @return An unmodifiable map of the execution settings for the function
   */
  public getExecutionSettings() {
    return Object.seal(this.executionSettings);
  }

  /**
   * Get the metadata for the function.
   *
   * @return The metadata for the function
   */
  public getMetadata() {
    return this.metadata;
  }

  /**
   * Invokes this KernelFunction.
   *
   * @param kernel The Kernel containing services, plugins, and other state for use throughout the
   *               operation.
   * @return The result of the function's execution.
   */
  // abstract invokeAsync(kernel: Kernel) {
  //   return new FunctionInvocation(kernel, this);
  // }

  /**
   * Invokes this KernelFunction.
   * <p>
   * If the {@code variableType} parameter is provided, the {@link ContextVariableType} is used to
   * convert the result of the function to the appropriate {@link FunctionResult}. The
   * {@code variableType} is not required for converting well-known types such as {@link String}
   * and {@link Integer} which have pre-defined {@code ContextVariableType}s.
   * <p>
   * The {@link InvocationContext} allows for customization of the behavior of function, including
   * the ability to pass in {@link KernelHooks} {@link PromptExecutionSettings}, and
   * {@link ToolCallBehavior}.
   * <p>
   * The difference between calling the {@code KernelFunction.invokeAsync} method directly and
   * calling the {@code Kernel.invokeAsync} method is that the latter adds the global KernelHooks
   * (if any) to the {@link InvocationContext}. Calling {@code KernelFunction.invokeAsync}
   * directly does not add the global hooks.
   *
   * @param kernel            The Kernel containing services, plugins, and other state for use
   *                          throughout the operation.
   * @param arguments         The arguments to pass to the function's invocation
   * @param variableType      The type of the {@link ContextVariable} returned in the
   *                          {@link FunctionResult}
   * @param invocationContext The arguments to pass to the function's invocation
   * @return The result of the function's execution.
   * @see FunctionResult#getResultVariable()
   */
  abstract invokeAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): RXJS.Observable<FunctionResult<T>>;

  async invoke(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): Promise<FunctionResult<T>> {
    const functionResult = await RXJS.lastValueFrom(
      this.invokeAsync(kernel, kernelArguments, invocationContext)
    );

    return functionResult;
  }
}
