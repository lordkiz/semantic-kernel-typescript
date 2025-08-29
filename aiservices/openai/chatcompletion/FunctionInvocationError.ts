import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import { ChatCompletionMessageParam } from "openai/resources"

/**
 * Exception to be thrown when a function invocation fails.
 */
export class FunctionInvocationError extends SKException {
  private _messages: ChatCompletionMessageParam[]

  constructor(e: Error, messages: ChatCompletionMessageParam[]) {
    super(e.message, e)
    this._messages = messages
  }

  get messages() {
    return this._messages
  }
}
