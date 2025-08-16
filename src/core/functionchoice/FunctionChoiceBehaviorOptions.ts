import { SemanticKernelBuilder } from "../builders/SemanticKernelBuilder"

export class FunctionChoiceBehaviorOptions {
  private parallelCallsAllowed: boolean

  constructor(parallelCallsAllowed: boolean) {
    this.parallelCallsAllowed = parallelCallsAllowed
  }

  /**
   * Returns a new builder for {@link FunctionChoiceBehaviorOptions}.
   */
  public static Builder() {
    return new Builder()
  }

  /**
   * Indicates whether parallel calls to functions are allowed.
   *
   * @return True if parallel calls are allowed; otherwise, false.
   */
  isParallelCallsAllowed() {
    return this.parallelCallsAllowed
  }
}

/**
 * Builder for {@link FunctionChoiceBehaviorOptions}.
 */
class Builder implements SemanticKernelBuilder<FunctionChoiceBehaviorOptions> {
  private allowParallelCalls = false

  /**
   * Sets whether parallel calls to functions are allowed.
   *
   * @param allowParallelCalls True if parallel calls are allowed; otherwise, false.
   * @return The builder instance.
   */
  public withParallelCallsAllowed(allowParallelCalls: boolean) {
    this.allowParallelCalls = allowParallelCalls
    return this
  }

  build() {
    return new FunctionChoiceBehaviorOptions(this.allowParallelCalls)
  }
}
