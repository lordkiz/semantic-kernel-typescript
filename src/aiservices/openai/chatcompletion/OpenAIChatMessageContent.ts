import FunctionCallContent from "../../../semantickernel/contents/FunctionCallContent"
import FunctionResultMetadata from "../../../semantickernel/orchestration/FunctionResultMetadata"
import { AuthorRole } from "../../../semantickernel/services/chatcompletion/AuthorRole"
import ChatMessageContent from "../../../semantickernel/services/chatcompletion/ChatMessageContent"
import { ChatMessageContentType } from "../../../semantickernel/services/chatcompletion/message/ChatMessageContentType"

export default class OpenAIChatMessageContent<T> extends ChatMessageContent<T> {
  constructor(
    authorRole: AuthorRole,
    content: string,
    modelId?: string,
    innerContent?: T,
    encoding?: BufferEncoding,
    metadata?: FunctionResultMetadata<any>,
    functionCalls?: FunctionCallContent<T>[]
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
