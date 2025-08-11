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
  private readonly _authorRole: AuthorRole
  private readonly _content: string
  private readonly _items: KernelContent<T>[] | undefined
  private readonly _encoding: BufferEncoding | undefined
  private readonly _contentType: ChatMessageContentType

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
    this._authorRole = authorRole
    this._items = items
    this._content = content
    this._encoding = encoding
    this._contentType = contentType
  }

  static clone<T>(chatMessageContent: ChatMessageContent<T>) {
    return new ChatMessageContent<T>({
      authorRole: chatMessageContent.AuthorRole,
      content: chatMessageContent.content,
      items: chatMessageContent.items,
      encoding: chatMessageContent.encoding,
      contentType: chatMessageContent.contentType,
      modelId: chatMessageContent.modelId,
      innerContent: chatMessageContent.innerContent,
      metadata: chatMessageContent.getMetadata(),
    })
  }

  /**
   * Gets the author role that generated the content
   *
   * @return The author role that generated the content
   */
  public get AuthorRole(): AuthorRole {
    return this._authorRole
  }

  /**
   * Gets the content
   *
   * @return The content, which may be null
   */
  public get content(): string {
    return this._content
  }

  /**
   * Gets the KernelContent items that comprise the content.
   *
   * @return The items, which may be null
   */
  public get items(): KernelContent<T>[] | undefined {
    return this._items ? [...this._items] : undefined
  }

  /**
   * Gets the encoding of the content
   *
   * @return The encoding, which may be null
   */
  public get encoding(): BufferEncoding | undefined {
    return this._encoding
  }

  /**
   * Gets the content type
   *
   * @return The content type
   */
  public get contentType(): ChatMessageContentType {
    return this._contentType
  }

  public toString(): string {
    return this.content ?? ""
  }
}
