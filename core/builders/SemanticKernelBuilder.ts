/**
 * Interface for all builders.
 *
 * @param <T> the type to build.
 */
export interface SemanticKernelBuilder<T> {
  /**
   * Build the object.
   *
   * @return a constructed object.
   */
  build(): T
}
