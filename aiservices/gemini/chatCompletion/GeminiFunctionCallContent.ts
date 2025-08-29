import { FunctionCall } from "@google/genai"
import { FunctionCallContent } from "@semantic-kernel-typescript/core/contents"
import { KernelArguments } from "@semantic-kernel-typescript/core/functions"
import { FunctionResult, ToolCallBehavior } from "@semantic-kernel-typescript/core/orchestration"
import { ChatMessageContent } from "@semantic-kernel-typescript/core/services"

/**
 * Represents a function call in Gemini.
 * A GeminiFunctionCallContent which does not have a functionResult represents
 *  a function call that has not been executed
 */
export class GeminiFunctionCallContent extends FunctionCallContent<any> {
  private _functionCall: FunctionCall

  private _functionResult: FunctionResult<any> | undefined

  /**
   * Creates a new Gemini function call.
   * @param functionCall The function call
   * @param functionResult The result of the function invocation
   */
  constructor(functionCall: FunctionCall, functionResult?: FunctionResult<unknown>) {
    // Split the full name of a function into plugin and function name
    const name = functionCall.name
    const parts = name?.split(ToolCallBehavior.FUNCTION_NAME_SEPARATOR) ?? ""
    const pluginName = parts.length > 1 ? parts[0] : ""
    const functionName = parts.length > 1 ? parts[1] : parts[0]
    const kernelArguments = KernelArguments.Builder().build()

    const jsonToolCallArguments = functionCall.args ?? {}

    for (const [k, v] of Object.entries(jsonToolCallArguments)) {
      kernelArguments.set(k, v)
    }
    super(functionName, pluginName, functionCall.id, kernelArguments)
    this._functionCall = functionCall
    this._functionResult = functionResult
  }

  static getFunctionTools(messageContent: ChatMessageContent<any>) {
    return (messageContent.items ?? []).filter((item) => item instanceof GeminiFunctionCallContent)
  }

  /**
   * Gets the function call.
   * @return The function call
   */
  get functionCall() {
    return this._functionCall
  }

  get functionResult() {
    return this._functionResult
  }
}
