import FunctionResultMetadata from "../../../../core/orchestration/FunctionResultMetadata"
import { AuthorRole } from "../../..../../../../core/src/orchestration/FunctionResultMetadata
import ChatMessageContent fr../../../../core/src/services/chatcompletion/AuthorRolessageContent"
import { ChatMessageContentType ../../../../core/src/services/chatcompletion/ChatMessageContentatMessageContentType"
import FunctionCallContent from "../../.../../../../core/src/services/chatcompletion/message/ChatMessageContentType

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
