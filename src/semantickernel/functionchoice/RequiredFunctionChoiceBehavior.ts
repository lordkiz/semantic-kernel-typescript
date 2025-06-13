import KernelFunction from "../functions/KernelFunction";
import AutoFunctionChoiceBehavior from "./AutoFunctionChoiceBehavior";
import FunctionChoiceBehaviorOptions from "./FunctionChoiceBehaviorOptions";

export default class RequiredFunctionChoiceBehavior extends AutoFunctionChoiceBehavior {
  /**
   * Create a new instance of RequiredFunctionChoiceBehavior.
   *
   * @param autoInvoke Whether auto-invocation is enabled.
   * @param functions  A set of functions to advertise to the model.
   * @param options    Options for the function choice behavior.
   */
  constructor(
    autoInvoke: boolean,
    fns?: KernelFunction<any>[],
    options?: FunctionChoiceBehaviorOptions
  ) {
    super(autoInvoke, fns, options);
  }
}
