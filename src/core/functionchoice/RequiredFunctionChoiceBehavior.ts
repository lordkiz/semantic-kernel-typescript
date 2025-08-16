import { KernelPlugin } from "../plugin"
import { AutoFunctionChoiceBehavior } from "./AutoFunctionChoiceBehavior"
import { FunctionChoiceBehaviorOptions } from "./FunctionChoiceBehaviorOptions"

export class RequiredFunctionChoiceBehavior extends AutoFunctionChoiceBehavior {
  /**
   * Create a new instance of RequiredFunctionChoiceBehavior.
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
    super(autoInvoke, plugins, options)
  }
}
