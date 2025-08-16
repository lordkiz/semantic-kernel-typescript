import { FunctionResultMetadata } from "../orchestration/FunctionResultMetadata"
import { KernelContentImpl } from "./KernelContentImpl"
import { StreamingKernelContent } from "./types/StreamingKernelContent"

/**
 * Base class which represents the content returned by a streaming AI service.
 *
 * @param <T> The type of the content.
 */
export abstract class StreamingTextContent<T>
  extends KernelContentImpl<T>
  implements StreamingKernelContent<T>
{
  /**
   * In a scenario of multiple choices per request, this represents the zero-based index of the
   * choice in the streaming sequence
   */
  private choiceIndex: number

  /**
   * Initializes a new instance of the {@link StreamingTextContent} class.
   *
   * @param innerContent The inner content representation.
   * @param choiceIndex  The zero-based index of the choice in the streaming sequence.
   * @param modelId      The model identifier used to generate the content.
   * @param metadata     The metadata associated with the content.
   */
  constructor(
    choiceIndex: number,
    innerContent?: T,
    modelId?: string,
    metadata?: FunctionResultMetadata<any>
  ) {
    super(innerContent, modelId, metadata)
    this.choiceIndex = choiceIndex
  }

  /**
   * Gets the zero-based index of the choice in the streaming sequence.
   *
   * @return The zero-based index of the choice in the streaming sequence.
   */
  getChoiceIndex() {
    return this.choiceIndex
  }
}
