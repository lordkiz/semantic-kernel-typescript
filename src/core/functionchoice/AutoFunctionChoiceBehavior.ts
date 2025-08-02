import { KernelPlugin } from "../plugin"
import FunctionChoiceBehavior from "./FunctionChoiceBehavior"
import FunctionChoiceBehaviorOptions from "./FunctionChoiceBehaviorOptions"

/**
 * A set of allowed kernel functions. All kernel functions are allowed if allKernelFunctionsAllowed is true.
 * Otherwise, only the functions in allowedFunctions are allowed.
 * <p>
 * If a function is allowed, it may be called. If it is not allowed, it will not be called.
 */
export default class AutoFunctionChoiceBehavior extends FunctionChoiceBehavior {
  private autoInvoke: boolean

  /**
   * Create a new instance of AutoFunctionChoiceBehavior.
   *
   * @param autoInvoke Whether auto-invocation is enabled.
   * @param plugins  A set of plugins containing functions to advertise to the model.
   * @param options    Options for the function choice behavior.
   */
  constructor(
    autoInvoke: boolean,
    plugins?: KernelPlugin[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    super(plugins, options)
    this.autoInvoke = autoInvoke
  }

  /**
   * Check whether the given function is allowed.
   *
   * @return Whether the function is allowed.
   */
  isAutoInvoke() {
    return this.autoInvoke
  }
}
