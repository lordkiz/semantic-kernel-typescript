import KernelArguments from "../functions/KernelArguments";
import Variable from "../variables/Variable";
import FunctionResultMetadata from "./FunctionResultMetadata";

/**
 * The result of a function invocation.
 * <p>
 * This class is used to return the result of a function invocation. It contains the result of the
 * function invocation and metadata about the result.
 *
 * @param <T> The type of the result of the function invocation.
 */
export default class FunctionResult<T> {
  private result: Variable<T>;
  private metadata: FunctionResultMetadata<unknown>;
  private unconvertedResult: object;

  constructor(
    result: Variable<T>,
    metadata?: FunctionResultMetadata<unknown>,
    unconvertedResult?: Variable<T>
  ) {
    this.result = result;
    this.metadata = metadata || FunctionResultMetadata.empty();
    this.unconvertedResult = unconvertedResult || {};
  }

  /**
   * Get the result of the function invocation.
   * <em>NOTE: If you get a ClassCastException from this method,
   * try adding a result type with {@link FunctionInvocation#withResultType(ContextVariableType)}
   * )}</em>
   *
   * @return The result of the function invocation.
   * @throws ClassCastException If the result is not of the expected type.
   */
  getResult(): T {
    return this.result.getValue();
  }

  /**
   * Get the result of the function invocation.
   *
   * @return The result of the function invocation.
   */
  getResultVariable(): Variable<T> {
    return this.result;
  }

  /**
   * Get the metadata about the result of the function invocation.
   *
   * @return The metadata about the result of the function invocation.
   */
  getMetadata() {
    return this.metadata;
  }
}
