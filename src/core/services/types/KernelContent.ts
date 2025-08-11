import FunctionResultMetadata from "../../orchestration/FunctionResultMetadata"

/**
 * Base class which represents the content returned by an AI service.
 *
 * @param <T> The type of the content.
 */
export interface KernelContent<T> {
  /**
   * The inner content representation. Use this to bypass the current
   * abstraction. The usage of this property is considered "unsafe".
   * Use it only if strictly necessary.
   * @return The inner content.
   */
  get innerContent(): T | undefined

  /**
   * The metadata associated with the content.
   * @return The metadata.
   */
  getMetadata<UsageType>(): FunctionResultMetadata<UsageType> | undefined

  /**
   * Gets the content returned by the AI service.
   *
   * @return The content.
   */
  get content(): string | undefined
}
