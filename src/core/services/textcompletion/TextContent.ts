import { FunctionResultMetadata } from "../../orchestration/FunctionResultMetadata"
import { KernelContentImpl } from "../KernelContentImpl"

/**
 * Content from a text completion service.
 */
export class TextContent extends KernelContentImpl<string> {
  private readonly _content: string

  /**
   * Initializes a new instance of the {@code TextContent} class with a provided content, model
   * ID, and metadata.
   *
   * @param content  The content.
   * @param modelId  The model ID.
   * @param metadata The metadata.
   */
  constructor(content: string, modelId: string, metadata: FunctionResultMetadata<object>) {
    super(content, modelId, metadata)
    this._content = content
  }

  /**
   * Gets the content.
   *
   * @return The content.
   */
  public get value() {
    return this.content
  }

  override get content() {
    return this._content
  }
}
