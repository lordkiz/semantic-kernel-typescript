import KernelArguments from "../functions/KernelArguments"
import ToolCallBehavior from "../orchestration/ToolCallBehavior"
import ChatMessageContent from "../services/chatcompletion/ChatMessageContent"
import KernelContentImpl from "../services/KernelContentImpl"

/**
 * Represents the content of a function call.
 * <p>
 * This class is used to represent a function call in the context of a chat message.
 */
export default class FunctionCallContent<T> extends KernelContentImpl<T> {
  private _id: string | undefined
  private _pluginName: string | undefined
  private _functionName: string
  private _kernelArguments: KernelArguments | undefined

  constructor(
    functionName: string,
    pluginName?: string,
    id?: string,
    kernelArguments?: KernelArguments
  ) {
    super()
    this._functionName = functionName
    this._pluginName = pluginName
    this._id = id || this.fullName
    this._kernelArguments = kernelArguments?.copy()
  }

  static getFunctionTools(messageContent: ChatMessageContent<any>) {
    return (messageContent.items ?? []).filter((item) => item instanceof FunctionCallContent)
  }

  get id() {
    return this._id
  }
  get pluginName() {
    return this._pluginName
  }
  get functionName() {
    return this._functionName
  }
  get kernelArguments() {
    return this._kernelArguments?.copy()
  }

  get fullName() {
    return ToolCallBehavior.formFullFunctionName(this._pluginName ?? "", this._functionName)
  }

  override get content(): string | undefined {
    return undefined
  }
}
