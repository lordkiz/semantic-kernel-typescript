import KernelArguments from "../functions/KernelArguments"
import ChatMessageContent from "../services/chatcompletion/ChatMessageContent"
import KernelContentImpl from "../services/KernelContentImpl"

/**
 * Represents the content of a function call.
 * <p>
 * This class is used to represent a function call in the context of a chat message.
 */
export default class FunctionCallContent<T> extends KernelContentImpl<T> {
  private readonly id: string | undefined
  private readonly pluginName: string | undefined
  private readonly functionName: string
  private readonly kernelArguments: KernelArguments | undefined

  constructor(
    functionName: string,
    pluginName?: string,
    id?: string,
    kernelArguments?: KernelArguments
  ) {
    super()
    this.functionName = functionName
    this.pluginName = pluginName
    this.id = id
    this.kernelArguments = kernelArguments?.copy()
  }

  static getFunctionTools(messageContent: ChatMessageContent<any>) {
    return messageContent.getItems()?.filter((item) => item instanceof FunctionCallContent)
  }

  getId() {
    return this.id
  }
  getPluginName() {
    return this.pluginName
  }
  getFunctionName() {
    return this.functionName
  }
  getArguments() {
    return this.kernelArguments?.copy()
  }

  override getContent(): string | undefined {
    return undefined
  }
}
