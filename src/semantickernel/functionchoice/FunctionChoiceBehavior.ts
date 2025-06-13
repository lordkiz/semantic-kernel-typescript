import KernelFunction from "../functions/KernelFunction";
import AutoFunctionChoiceBehavior from "./AutoFunctionChoiceBehavior";
import FunctionChoiceBehaviorOptions from "./FunctionChoiceBehaviorOptions";
import NoneFunctionChoiceBehavior from "./NoneFunctionChoiceBehavior";
import RequiredFunctionChoiceBehavior from "./RequiredFunctionChoiceBehavior";

/**
 * Defines the behavior of a tool call. Currently, the only tool available is function calling.
 */
export default abstract class FunctionChoiceBehavior {
  private fullFunctionNames: Set<String>;

  protected fns: KernelFunction<any>[];
  protected options: FunctionChoiceBehaviorOptions;

  constructor(
    fns?: KernelFunction<any>[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    this.fns = fns || [];
    this.fullFunctionNames = new Set<string>();

    this.fns.forEach((fn) => {
      if (fn) {
        this.fullFunctionNames.add(
          FunctionChoiceBehavior.formFullFunctionName(
            fn.getPluginName(),
            fn.getName()
          )
        );
      }
    });

    this.options = options || FunctionChoiceBehaviorOptions.builder().build();
  }

  /**
   * Gets the functions that are allowed.
   *
   * @return The functions that are allowed.
   */
  getFunctions() {
    return Object.seal(this.fns);
  }

  /**
   * Gets the options for the function choice behavior.
   *
   * @return The options for the function choice behavior.
   */
  getOptions() {
    return this.options;
  }

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides all the Kernel's plugins functions to the AI model to call.
   *
   * @param autoInvoke Indicates whether the functions should be automatically invoked by AI connectors
   *
   * @return A new ToolCallBehavior instance with all kernel functions allowed.
   */
  static auto(autoInvoke: boolean): AutoFunctionChoiceBehavior;

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides either all the Kernel's plugins functions to the AI model to call or specific functions.
   *
   * @param autoInvoke Enable or disable auto-invocation.
   *                   If auto-invocation is enabled, the model may request that the Semantic Kernel
   *                   invoke the kernel functions and return the value to the model.
   * @param functions Functions to provide to the model. If null, all the Kernel's plugins' functions are provided to the model.
   *                  If empty, no functions are provided to the model, which is equivalent to disabling function calling.
   *
   * @return A new FunctionChoiceBehavior instance with all kernel functions allowed.
   */
  static auto(
    autoInvoke: boolean,
    fns?: KernelFunction<any>[]
  ): AutoFunctionChoiceBehavior;

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides either all the Kernel's plugins functions to the AI model to call or specific functions.
   *
   * @param autoInvoke Enable or disable auto-invocation.
   *                   If auto-invocation is enabled, the model may request that the Semantic Kernel
   *                   invoke the kernel functions and return the value to the model.
   * @param functions Functions to provide to the model. If null, all the Kernel's plugins' functions are provided to the model.
   *                  If empty, no functions are provided to the model, which is equivalent to disabling function calling.
   * @param options   Options for the function choice behavior.
   *
   * @return A new FunctionChoiceBehavior instance with all kernel functions allowed.
   */
  static auto(
    autoInvoke: boolean,
    fns?: KernelFunction<any>[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    return new AutoFunctionChoiceBehavior(autoInvoke, fns, options);
  }

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides either all the Kernel's plugins functions to the AI model to call or specific functions.
   * <p>
   * This behavior forces the model to call the provided functions.
   * SK connectors will invoke a requested function or multiple requested functions if the model requests multiple ones in one request,
   * while handling the first request, and stop advertising the functions for the following requests to prevent the model from repeatedly calling the same function(s).
   *
   * @return A new FunctionChoiceBehavior instance with the required function.
   */
  static required(
    autoInvoke: boolean,
    fns: KernelFunction<any>[]
  ): RequiredFunctionChoiceBehavior;

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides either all the Kernel's plugins functions to the AI model to call or specific functions.
   * <p>
   * This behavior forces the model to call the provided functions.
   * SK connectors will invoke a requested function or multiple requested functions if the model requests multiple ones in one request,
   * while handling the first request, and stop advertising the functions for the following requests to prevent the model from repeatedly calling the same function(s).
   *
   * @param functions Functions to provide to the model. If null, all the Kernel's plugins' functions are provided to the model.
   *                  If empty, no functions are provided to the model, which is equivalent to disabling function calling.
   * @return A new FunctionChoiceBehavior instance with the required function.
   */
  static required(
    autoInvoke: boolean,
    fns?: KernelFunction<any>[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    return new RequiredFunctionChoiceBehavior(autoInvoke, fns, options);
  }

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides either all the Kernel's plugins functions to the AI model to call or specific functions.
   * <p>
   * This behavior is useful if the user should first validate what functions the model will use.
   */
  static none(): NoneFunctionChoiceBehavior;

  /**
   * Gets an instance of the FunctionChoiceBehavior that provides either all the Kernel's plugins functions to the AI model to call or specific functions.
   * <p>
   * This behavior is useful if the user should first validate what functions the model will use.
   *
   * @param functions Functions to provide to the model. If null, all the Kernel's plugins' functions are provided to the model.
   *                  If empty, no functions are provided to the model, which is equivalent to disabling function calling.
   */
  static none(
    fns?: KernelFunction<any>[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    return new NoneFunctionChoiceBehavior(fns, options);
  }

  /**
   * Form the full function name.
   *
   * @param pluginName   The name of the plugin that the function is in.
   * @param functionName The name of the function.
   * @return The key for the function.
   */
  static formFullFunctionName(
    pluginName: string,
    functionName: string
  ): string {
    return `${pluginName}-${functionName}`;
  }

  /**
   * Check whether the given function is allowed.
   *
   * @param fn The function to check.
   * @return Whether the function is allowed.
   */
  isKernelFunctionAllowed(fn: KernelFunction<any>) {
    return this.isFunctionAllowed(fn.getPluginName(), fn.getName());
  }

  /**
   * Check whether the given function is allowed.
   *
   * @param pluginName   The name of the skill that the function is in.
   * @param functionName The name of the function.
   * @return Whether the function is allowed.
   */
  isFunctionAllowed(pluginName: string, functionName: string) {
    const key = FunctionChoiceBehavior.formFullFunctionName(
      pluginName,
      functionName
    );
    return this.fullFunctionNames.has(key);
  }
}
