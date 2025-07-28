import { FunctionCallContent } from "@semantic-kernel-typescript/core/contents"
import { FunctionResultMetadata } from "@semantic-kernel-typescript/core/orchestration"
import {
  AuthorRole,
  ChatMessageContent,
  ChatMessageContentType,
} from "@semantic-kernel-typescript/core/services"

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
