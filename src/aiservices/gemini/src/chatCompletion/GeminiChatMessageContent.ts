import FunctionResultMetadata from "../../../../core/src/orchestration/FunctionResultMetadata"
import { AuthorRole } from "../../../../core/src/services/chatcompletion/AuthorRole"
import ChatMessageContent from "../../../../core/src/services/chatcompletion/ChatMessageContent"
import { ChatMessageContentType } from "../../../../core/src/services/chatcompletion/message/ChatMessageContentType"
import GeminiFunctionCallContent from "./GeminiFunctionCallContent"

/**
 * Represents the content of a chat message.
 *
 * @param <T> The type of the inner content.
 */
export default class GeminiChatMessageContent<T> extends ChatMessageContent<T> {
  constructor(
    authorRole: AuthorRole,
    content: string,
    modelId?: string,
    innerContent?: T,
    encoding?: BufferEncoding,
    metadata?: FunctionResultMetadata<any>,
    functionCalls?: GeminiFunctionCallContent[]
  ) {
    super({
      authorRole,
      content,
      items: functionCalls,
      modelId,
      innerContent,
      encoding,
      metadata,
      contentType: ChatMessageContentType.TEXT,
    })
  }
}
