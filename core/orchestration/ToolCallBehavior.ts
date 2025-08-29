import { KernelFunction } from "../functions/KernelFunction"

/**
 * Defines the behavior of a tool call. Currently, the only tool available is function calling.
 */
export class ToolCallBehavior {
  static DEFAULT_MAXIMUM_AUTO_INVOKE_ATTEMPTS = 5
  static FUNCTION_NAME_SEPARATOR = "-"

  private maximumAutoInvokeAttempts: number

  constructor(
    maximumAutoInvokeAttempts:
      | number
      | undefined = ToolCallBehavior.DEFAULT_MAXIMUM_AUTO_INVOKE_ATTEMPTS
  ) {
    this.maximumAutoInvokeAttempts = maximumAutoInvokeAttempts
  }

  /**
   * Allow all kernel functions. All Kernel functions will be passed to the model.
   *
   * @param autoInvoke Enable or disable auto-invocation.
   *                   If auto-invocation is enabled, the model may request that the Semantic Kernel
   *                   invoke the kernel functions and return the value to the model.
   * @return A new ToolCallBehavior instance with all kernel functions allowed.
   */
  static allowAllKernelFunctions(autoInvoke: boolean): ToolCallBehavior {
    return new AllowedKernelFunctions(true, autoInvoke, [])
  }

  /**
   * Require a function. The required function will be the only function passed to the model
   * and forces the model to call the function. Only one function can be required.
   *
   * @param function The function to require.
   * @return A new ToolCallBehavior instance with the required function.
   */
  static requireKernelFunction(fn: KernelFunction<any>): ToolCallBehavior {
    return new RequiredKernelFunction(fn)
  }

  static formFullFunctionName(pluginName: string, functionName: string) {
    return `${pluginName}${ToolCallBehavior.FUNCTION_NAME_SEPARATOR}${functionName}`
  }

  /**
   * Allow a set of kernel functions.
   * If a function is allowed, it may be called. If it is not allowed, it will not be called.
   * By default, all functions are not allowed.
   *
   * @param autoInvoke Enable or disable auto-invocation.
   *                   If auto-invocation is enabled, the model may request that the Semantic Kernel
   *                   invoke the kernel functions and return the value to the model.
   * @param functions The functions to allow.
   * @return A new ToolCallBehavior instance with the allowed functions.
   */
  static allowOnlyKernelFunctions(
    autoInvoke: boolean,
    functions: KernelFunction<any>[]
  ): ToolCallBehavior {
    return new AllowedKernelFunctions(false, autoInvoke, functions)
  }

  /**
   * Check whether auto-invocation is enabled.
   *
   * @return Whether auto-invocation is enabled.
   */
  isAutoInvokeAllowed() {
    return this.maximumAutoInvokeAttempts > 0
  }

  /**
   * Get the maximum number of times that auto-invocation will be attempted.
   *
   * @return The maximum number of attempts.
   */
  getMaximumAutoInvokeAttempts() {
    return this.maximumAutoInvokeAttempts
  }
}

/**
 * A required kernel function.
 * The required function will be the only function passed to the model and forces the model to call the function.
 * Only one function can be required.
 */
export class RequiredKernelFunction extends ToolCallBehavior {
  private requiredFunction: KernelFunction<any>

  /**
   * Create a new instance of RequiredKernelFunction.
   *
   * @param requiredFunction The function that is required.
   */
  constructor(requiredFunction: KernelFunction<any>) {
    super(1)
    this.requiredFunction = requiredFunction
  }

  /**
   * Get the required function.
   * @return the required function.
   */
  getRequiredFunction() {
    return this.requiredFunction
  }
}

/**
 * A set of allowed kernel functions. All kernel functions are allowed if allKernelFunctionsAllowed is true.
 * Otherwise, only the functions in allowedFunctions are allowed.
 * <p>
 * If a function is allowed, it may be called. If it is not allowed, it will not be called.
 */
export class AllowedKernelFunctions extends ToolCallBehavior {
  private allowedFunctions: Set<string>
  private allKernelFunctionsAllowed: boolean

  constructor(
    allKernelFunctionsAllowed: boolean,
    autoInvoke: boolean,
    allowedFunctions: KernelFunction<unknown>[]
  ) {
    super(autoInvoke ? AllowedKernelFunctions.DEFAULT_MAXIMUM_AUTO_INVOKE_ATTEMPTS : 0)

    this.allKernelFunctionsAllowed = allKernelFunctionsAllowed
    this.allowedFunctions = new Set<string>()

    for (const fn of allowedFunctions) {
      this.allowedFunctions.add(
        AllowedKernelFunctions.formFullFunctionName(fn.getPluginName(), fn.getName())
      )
    }
  }

  /**
   * Check whether the given function is allowed.
   *
   * @param fn The function to check.
   * @return Whether the function is allowed.
   */
  isKernelFunctionAllowed(fn: KernelFunction<any>) {
    return this.isFunctionAllowed(fn.getPluginName(), fn.getName())
  }

  /**
   * Check whether the given function is allowed.
   *
   * @param pluginName   The name of the skill that the function is in.
   * @param functionName The name of the function.
   * @return Whether the function is allowed.
   */
  isFunctionAllowed(pluginName: string, functionName: string) {
    const key = AllowedKernelFunctions.formFullFunctionName(pluginName, functionName)
    return this.allowedFunctions.has(key)
  }

  /**
   * Check whether all kernel functions are allowed.
   *
   * @return Whether all kernel functions are allowed.
   */
  isAllKernelFunctionsAllowed() {
    return this.allKernelFunctionsAllowed
  }
}
