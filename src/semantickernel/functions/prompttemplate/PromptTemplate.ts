import { Observable } from "rxjs"
import Kernel from "../../Kernel"
import FunctionResult from "../../orchestration/FunctionResult"
import InvocationContext from "../../orchestration/InvocationContext"
import KernelArguments from "../KernelArguments"

/**
 * Represents a prompt template that can be rendered to a string.
 */
export interface PromptTemplate<T = string> {
  /**
   * Renders the template using the supplied {@code Kernel}, {@code KernelFunctionArguments}, and
   * {@code InvocationContext}.
   *
   * @param kernel    The {@link Kernel} containing services, plugins, and other state for use
   *                  throughout the operation.
   * @param kernelArguments The arguments to use to satisfy any input variables in the prompt template.
   * @param context   The {@link InvocationContext} which carries optional information for the
   *                  prompt rendering.
   * @return The rendered prompt.
   */
  renderAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    context?: InvocationContext<any>
  ): Observable<FunctionResult<T>>
}
