/**
 * Interface for all builders.
 *
 * @param <T> the type to build.
 */
export default interface SemanticKernelBuilder<T> {
  /**
   * Build the object.
   *
   * @return a constructed object.
   */
  build(): T;
}
