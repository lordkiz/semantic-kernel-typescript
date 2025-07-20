import { FunctionCall } from "@google/genai"
import FunctionCallContent from "../../../semantickernel/contents/FunctionCallContent"
import KernelArguments from "../../../semantickernel/functions/KernelArguments"
import FunctionResult from "../../../semantickernel/orchestration/FunctionResult"
import ToolCallBehavior from "../../../semantickernel/orchestration/ToolCallBehavior"

/**
 * Represents a function call in Gemini.
 */
export default class GeminiFunctionCallContent extends FunctionCallContent<any> {
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
