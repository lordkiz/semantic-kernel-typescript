import SemanticKernelBuilder from "../../../builders/SemanticKernelBuilder"
import SKException from "../../../exceptions/SKException"
import { AuthorRole } from "../AuthorRole"
import ChatMessageContent from "../ChatMessageContent"
import { ChatMessageContentType } from "./ChatMessageContentType"

enum ImageDetail {
  /**
   * Low detail
   */
  LOW = "LOW",
  /**
   * High detail
   */
  HIGH = "HIGH",
  /**
   * Automatically determine the detail level
   */
  AUTO = "AUTO",
}

/**
 * Represents an image content in a chat message.
 *
 * @param <T> the type of the inner content within the message
 */
export default class ChatMessageImageContent<T> extends ChatMessageContent<T> {
  static ImageDetail = ImageDetail

  private readonly detail: ImageDetail

  /**
   * Create a new instance of the {@link ChatMessageImageContent} class.
   * @param content The chat message content
   * @param modelId The LLM id to use for the chat
   * @param detail The detail level of the image to include in the chat message
   */
  constructor(content: string, modelId?: string, detail?: ImageDetail) {
    super({
      authorRole: AuthorRole.USER,
      content,
      modelId,
      contentType: ChatMessageContentType.IMAGE_URL,
    })

    this.detail = detail ?? ImageDetail.AUTO
  }

  /**
   * Get the detail level of the image to include in the chat message.
   *
   * @return the detail level of the image
   */
  getDetail() {
    return this.detail
  }

  /**
   * Create a new builder for the {@link ChatMessageImageContent} class.
   *
   * @param <T> the type of the inner content within the messages
   * @return a new builder
   */
  public static Builder<T>(): Builder<T> {
    return new Builder<T>()
  }
}

/**
 * Builder for the {@link ChatMessageImageContent} class.
 * @param <T> the type of the inner content within the message
 */
class Builder<T> implements SemanticKernelBuilder<ChatMessageImageContent<T>> {
  private modelId: string | undefined

  private content: string | undefined

  private detail: ImageDetail | undefined

  /**
   * Set the model ID to use for the chat message.
   *
   * @param modelId the model ID
   * @return {@code this} builder
   */
  withModelId(modelId: string): Builder<T> {
    this.modelId = modelId
    return this
  }

  /**
   * Set the image content to include in the chat message.
   * @param imageType For instance jpg or png. For known types known to OpenAI see: <a
   *                  href="https://platform.openai.com/docs/guides/vision/what-type-of-files-can-i-upload">docs</a>.
   * @param content   the image content
   * @return {@code this} builder
   */
  withImage(imageType: string, content: Buffer<ArrayBuffer>): Builder<T> {
    const b64 = Buffer.from(new Uint8Array(content)).toString("base64")
    this.content = `data:image/${imageType};base64,${b64}`
    return this
  }

  /**
   * Set the URL of the image to include in the chat message.
   *
   * @param url the URL of the image
   * @return {@code this} builder
   */
  withImageUrl(url: string): Builder<T> {
    this.content = url
    return this
  }

  /**
   * Set the detail level of the image to include in the chat message.
   *
   * @param detail the detail level of the image
   * @return {@code this} builder
   */
  withDetail(detail: ImageDetail): Builder<T> {
    this.detail = detail
    return this
  }

  build(): ChatMessageImageContent<T> {
    if (!this.detail) {
      this.detail = ImageDetail.AUTO
    }
    if (!this.content) {
      throw new SKException("Image content is required")
    }
    return new ChatMessageImageContent<T>(this.content, this.modelId, this.detail)
  }
}
