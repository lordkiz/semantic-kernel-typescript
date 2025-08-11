import { StreamingTextContent } from "@semantic-kernel-typescript/core/services"
import TextContent from "@semantic-kernel-typescript/core/services/textcompletion/TextContent"

/**
 * StreamingTextContent is a wrapper for TextContent that allows for streaming.
 */
export default class OpenAIStreamingTextContent extends StreamingTextContent<TextContent> {
  /**
   * Initializes a new instance of the {@code StreamingTextContent} class with a provided text
   * content.
   *
   * @param content The text content.
   */
  public constructor(content: TextContent) {
    super(0, content)
  }

  override get content() {
    const content = this.innerContent
    if (!content) {
      return
    }
    return content.content
  }
}
