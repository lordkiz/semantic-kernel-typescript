import { StreamingKernelContent } from "../types/StreamingKernelContent"

/**
 * Base class which represents the content returned by a chat completion service.
 * @param <T> The type of the content.
 */
export interface StreamingChatContent<T> extends StreamingKernelContent<T> {
  /**
   * Gets the ID of the content.
   * @return The ID.
   */
  get id(): string
}
