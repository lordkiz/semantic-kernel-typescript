import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { ChatCompletionMessageParam } from "openai/resources"

/**
 * Exception to be thrown when a function invocation fails.
 */
export default class FunctionInvocationError extends SKException {
  private messages: ChatCompletionMessageParam[]

  constructor(e: Error, msgs: ChatCompletionMessageParam[]) {
    super(e.message, e)
    this.messages = msgs
  }

  getMessages() {
    return this.messages
  }
}
