import { KernelPlugin } from "../plugin"
import FunctionChoiceBehavior from "./FunctionChoiceBehavior"
import FunctionChoiceBehaviorOptions from "./FunctionChoiceBehaviorOptions"

export default class NoneFunctionChoiceBehavior extends FunctionChoiceBehavior {
  /**
   * Create a new instance of NoneFunctionChoiceBehavior.
   */
  constructor(plugins?: KernelPlugin[], options?: FunctionChoiceBehaviorOptions) {
    super(plugins, options)
  }
}
