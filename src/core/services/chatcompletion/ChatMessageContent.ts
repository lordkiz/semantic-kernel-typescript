import FunctionResultMetadata from "../../orchestration/FunctionResultMetadata"
import KernelContentImpl from "../KernelContentImpl"
import { KernelContent } from "../types/KernelContent"
import { AuthorRole } from "./AuthorRole"
import { ChatMessageContentType } from "./message/ChatMessageContentType"

interface ChatMessageContentParams<T> {
  authorRole: AuthorRole
  content: string
  items?: KernelContent<T>[]
  encoding?: BufferEncoding
  contentType: ChatMessageContentType
  modelId?: string
  innerContent?: T
  metadata?: FunctionResultMetadata<T>
}

/**
 * Represents the content of a chat message
 *
 * This class defaults to a {@link ChatMessageContentType.TEXT} content type if none is specified.
 * For text content, consider using a more specific text content class instead.
 *
 * @typeparam T - The type of the inner content within the messages
 */
export default class ChatMessageContent<T> extends KernelContentImpl<T> {
  private readonly authorRole: AuthorRole
  private readonly content: string
  private readonly items: KernelContent<T>[] | undefined
  private readonly encoding: BufferEncoding | undefined
  private readonly contentType: ChatMessageContentType

  constructor({
    authorRole,
    content,
    items,
    encoding,
    contentType,
    modelId,
    innerContent,
    metadata,
  }: ChatMessageContentParams<T>) {
    super(innerContent, modelId, metadata)
    this.authorRole = authorRole
    this.items = items
    this.content = content
    this.encoding = encoding
    this.contentType = contentType
  }

  static clone<T>(chatMessageContent: ChatMessageContent<T>) {
    return new ChatMessageContent<T>({
      authorRole: chatMessageContent.getAuthorRole(),
      content: chatMessageContent.getContent(),
      items: chatMessageContent.getItems(),
      encoding: chatMessageContent.getEncoding(),
      contentType: chatMessageContent.getContentType(),
      modelId: chatMessageContent.getModelId(),
      innerContent: chatMessageContent.getInnerContent(),
      metadata: chatMessageContent.getMetadata(),
    })
  }

  /**
   * Gets the author role that generated the content
   *
   * @return The author role that generated the content
   */
  public getAuthorRole(): AuthorRole {
    return this.authorRole
  }

  /**
   * Gets the content
   *
   * @return The content, which may be null
   */
  public getContent(): string {
    return this.content
  }

  /**
   * Gets the KernelContent items that comprise the content.
   *
   * @return The items, which may be null
   */
  public getItems(): KernelContent<T>[] | undefined {
    return this.items ? [...this.items] : undefined
  }

  /**
   * Gets the encoding of the content
   *
   * @return The encoding, which may be null
   */
  public getEncoding(): BufferEncoding | undefined {
    return this.encoding
  }

  /**
   * Gets the content type
   *
   * @return The content type
   */
  public getContentType(): ChatMessageContentType {
    return this.contentType
  }

  public toString(): string {
    return this.content ?? ""
  }
}
