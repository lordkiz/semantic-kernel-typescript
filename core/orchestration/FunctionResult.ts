import { ContextVariable } from "../variables/ContextVariable"
import { FunctionResultMetadata } from "./FunctionResultMetadata"

/**
 * The result of a function invocation.
 * <p>
 * This class is used to return the result of a function invocation. It contains the result of the
 * function invocation and metadata about the result.
 *
 * @param <T> The type of the result of the function invocation.
 */
export class FunctionResult<T> {
  private _result: T
  private _metadata: FunctionResultMetadata<unknown>

  constructor(result: T, metadata?: FunctionResultMetadata<unknown>) {
    this._result = result
    this._metadata = metadata || FunctionResultMetadata.empty()
  }

  /**
   * Get the result of the function invocation.
   *
   * @return The result of the function invocation.
   * @throws ClassCastException If the result is not of the expected type.
   */
  get result(): T {
    return this._result
  }

  /**
   * Get the result of the function invocation.
   *
   * @return The result of the function invocation.
   */
  get resultVariable(): ContextVariable<T> {
    return ContextVariable.of(this.result)
  }

  /**
   * Get the metadata about the result of the function invocation.
   *
   * @return The metadata about the result of the function invocation.
   */
  get metadata() {
    return this._metadata
  }
}
