import { SemanticKernelBuilder } from "../../../builders/SemanticKernelBuilder"
import { SKException } from "../../../exceptions/SKException"
import { FunctionResultMetadata } from "../../../orchestration/FunctionResultMetadata"
import { KernelContent } from "../../types/KernelContent"
import { AuthorRole } from "../AuthorRole"
import { ChatMessageContent } from "../ChatMessageContent"
import { ChatMessageContentType } from "./ChatMessageContentType"

/**
 * Represents the content of a chat message which contains text
 */
export class ChatMessageTextContent extends ChatMessageContent<string> {
  /**
   * Creates a new instance of the {@link ChatMessageTextContent} class.
   *
   * @param authorRole the author role that generated the content
   * @param content    the content
   * @param modelId    the model id
   * @param encoding   the encoding of the content
   * @param metadata   the metadata
   */
  constructor(
    authorRole: AuthorRole,
    content: string,
    modelId?: string,
    encoding?: BufferEncoding,
    metadata?: FunctionResultMetadata<string>
  ) {
    super({
      authorRole,
      content,
      modelId,
      encoding,
      metadata,
      contentType: ChatMessageContentType.TEXT,
    })
  }

  /**
   * Create a new builder for the {@link ChatMessageTextContent} class.
   *
   * @return a new builder
   */
  public static Builder(): Builder {
    return new Builder()
  }

  private static buildContent(role: AuthorRole, content: string): ChatMessageTextContent {
    return new Builder().withAuthorRole(role).withContent(content).build()
  }

  /**
   * Create a message with the author role set to {@link AuthorRole#USER}
   *
   * @param content The content of the message
   * @return The message
   */
  static userMessage(content: string): ChatMessageTextContent {
    return ChatMessageTextContent.buildContent(AuthorRole.USER, content)
  }

  /**
   * Create a message with the author role set to {@link AuthorRole#ASSISTANT}
   *
   * @param content The content of the message
   * @return The message
   */
  public static assistantMessage(content: string): ChatMessageTextContent {
    return ChatMessageTextContent.buildContent(AuthorRole.ASSISTANT, content)
  }

  /**
   * Create a message with the author role set to {@link AuthorRole#SYSTEM}
   *
   * @param content The content of the message
   * @return The message
   */
  public static systemMessage(content: string) {
    return ChatMessageTextContent.buildContent(AuthorRole.SYSTEM, content)
  }
}

/**
 * Builder for the {@link ChatMessageTextContent} class.
 */
class Builder implements SemanticKernelBuilder<ChatMessageTextContent> {
  private modelId: string | undefined
  private metadata: FunctionResultMetadata<string> | undefined
  private authorRole: AuthorRole | undefined
  private content: string | undefined
  private items: KernelContent<string>[] | undefined
  private encoding: BufferEncoding | undefined

  /**
   * Set the content of the message
   *
   * @param content The content of the message
   * @return The builder
   */
  withContent(content: string) {
    this.content = content
    return this
  }

  /**
   * Set the model ID used to generate the content
   *
   * @param modelId The model ID
   * @return The builder
   */
  withModelId(modelId: string) {
    this.modelId = modelId
    return this
  }

  /**
   * Set the metadata associated with the content
   *
   * @param metadata The metadata
   * @return The builder
   */
  withMetadata(metadata: FunctionResultMetadata<string>) {
    this.metadata = metadata
    return this
  }

  /**
   * Set the author role of the message
   *
   * @param authorRole The author role
   * @return The builder
   */
  withAuthorRole(authorRole: AuthorRole) {
    this.authorRole = authorRole
    return this
  }

  /**
   * Set the encoding of the message
   *
   * @param encoding The encoding
   * @return The builder
   */
  withEncoding(encoding: BufferEncoding) {
    this.encoding = encoding
    return this
  }

  build(): ChatMessageTextContent {
    if (!this.authorRole) {
      throw new SKException("Author role must be set")
    }
    if (this.content === undefined) {
      throw new SKException("Content must be set")
    }
    return new ChatMessageTextContent(
      this.authorRole,
      this.content,
      this.modelId,
      this.encoding,
      this.metadata
    )
  }
}
