import KernelFunction from "../functions/KernelFunction";
import FunctionChoiceBehavior from "./FunctionChoiceBehavior";
import FunctionChoiceBehaviorOptions from "./FunctionChoiceBehaviorOptions";

export default class NoneFunctionChoiceBehavior extends FunctionChoiceBehavior {
  /**
   * Create a new instance of NoneFunctionChoiceBehavior.
   */
  constructor(
    fns?: KernelFunction<any>[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    super(fns, options);
  }
}
