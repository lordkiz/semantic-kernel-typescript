import { Observable } from "rxjs"
import Kernel from "../../Kernel"
import InvocationContext from "../../orchestration/InvocationContext"
import { TextAIService } from "../types/TextAIService"
import ChatHistory from "./ChatHistory"
import ChatMessageContent from "./ChatMessageContent"
import { StreamingChatContent } from "./StreamingChatContent"

/**
 * Chat completion service interface.
 */
export abstract class ChatCompletionService extends TextAIService {
  /**
   * Gets the chat message contents asynchronously using {@code ChatHistory} or {@code prompt}
   * to support a turn-based conversation.
   * Typically, the resulting chat message contents is appended to the
   * {@code chatHistory} to continue the conversation.
   *
   * @param promptOrChatHistory  the chat history or prompt
   * @param kernel            the kernel
   * @param invocationContext the invocation context
   * @return the chat message contents
   */
  abstract getChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel?: Kernel,
    invocationContext?: InvocationContext
  ): Observable<ChatMessageContent<string>[]>

  /**
   * Gets the chat message contents asynchronously using {@code ChatHistory} or {@code prompt}
   * to support a turn-based conversation. Typically, the resulting chat message contents is appended to the
   * {@code chatHistory} to continue the conversation.
   *
   * @param promptOrChatHistory       the chat history or prompt
   * @param kernel            the kernel
   * @param invocationContext the invocation context
   * @return the chat message contents
   */
  abstract getStreamingChatMessageContentsAsync(
    promptOrChatHistory: string | ChatHistory,
    kernel?: Kernel,
    invocationContext?: InvocationContext
  ): Observable<StreamingChatContent<any>[]>
}
