import FunctionCallContent from "../../../semantickernel/contents/FunctionCallContent"
import FunctionResultMetadata from "../../../semantickernel/orchestration/FunctionResultMetadata"
import { AuthorRole } from "../../../semantickernel/services/chatcompletion/AuthorRole"
import { StreamingChatContent } from "../../../semantickernel/services/chatcompletion/StreamingChatContent"
import OpenAIChatMessageContent from "./OpenAIChatMessageContent"

/**
 * Represents the content of a chat message.
 *
 * @param <T> The type of the inner content.
 */
export default class OpenAIStreamingChatMessageContent<T>
  extends OpenAIChatMessageContent<T>
  implements StreamingChatContent<T>
{
  private _id: string

  /**
   * Creates a new instance of the {@link GeminiChatMessageContent} class.
   *
   * @param authorRole          The author role that generated the content.
   * @param content             The content.
   * @param modelId             The model id.
   * @param innerContent        The inner content.
   * @param encoding            The encoding.
   * @param metadata            The metadata.
   * @param id                  The id of the message.
   * @param geminiFunctionCalls The function calls.
   */
  constructor(
    id: string,
    authorRole: AuthorRole,
    content: string,
    modelId?: string,
    innerContent?: T,
    encoding?: BufferEncoding,
    metadata?: FunctionResultMetadata<any>,
    functionCalls?: FunctionCallContent<any>[]
  ) {
    super(authorRole, content, modelId, innerContent, encoding, metadata, functionCalls)
    this._id = id
  }

  getId(): string {
    return this._id
  }
}
