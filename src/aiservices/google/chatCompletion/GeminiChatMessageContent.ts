import FunctionResultMetadata from "../../../semantickernel/orchestration/FunctionResultMetadata"
import { AuthorRole } from "../../../semantickernel/services/chatcompletion/AuthorRole"
import ChatMessageContent from "../../../semantickernel/services/chatcompletion/ChatMessageContent"
import { ChatMessageContentType } from "../../../semantickernel/services/chatcompletion/message/ChatMessageContentType"
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
