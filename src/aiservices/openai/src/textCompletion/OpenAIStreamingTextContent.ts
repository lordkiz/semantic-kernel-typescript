import StreamingTextContent from "../../../../core/src/services/StreamingTextContent"
import TextContent from "../../../../core/src/services/textcompletion/TextContent"

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

  override getContent() {
    const content = this.getInnerContent()
    if (!content) {
      return
    }
    return content.getContent()
  }
}
