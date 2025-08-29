import { Kernel } from "../Kernel"
import { SemanticKernelBuilder } from "../builders"
import { KernelArguments } from "../functions"
import { InvocationContext } from "../orchestration"

export class AgentInvokeOptions {
  private _kernel?: Kernel
  private _kernelArguments?: KernelArguments
  private _invocationContext?: InvocationContext
  private _additionalInstructions?: string

  constructor(
    kernel?: Kernel,
    kernelArguments?: KernelArguments,
    additionalInstructions?: string,
    invocationContext?: InvocationContext
  ) {
    this._kernel = kernel
    this._kernelArguments = kernelArguments
    this._additionalInstructions = additionalInstructions
    this._invocationContext = invocationContext
  }

  static Builder(): AgentInvokeOptionsBuilder {
    return new AgentInvokeOptionsBuilder()
  }

  get kernel() {
    return this._kernel
  }
  get kernelArguments() {
    return this._kernelArguments
  }
  get invocationContext() {
    return this._invocationContext
  }
  get additionalInstructions() {
    return this._additionalInstructions
  }
}

class AgentInvokeOptionsBuilder implements SemanticKernelBuilder<AgentInvokeOptions> {
  private _kernelArguments: KernelArguments | undefined
  private _kernel: Kernel | undefined
  private _additionalInstructions: string | undefined
  private _invocationContext: InvocationContext | undefined

  withKernelArguments(kernelArguments: KernelArguments) {
    this._kernelArguments = kernelArguments
    return this
  }
  withKernel(kernel: Kernel) {
    this._kernel = kernel
    return this
  }
  withAdditionalInstructions(additionalInstructions: string) {
    this._additionalInstructions = additionalInstructions
    return this
  }
  withInvocationContext(invocationContext: InvocationContext) {
    this._invocationContext = invocationContext
    return this
  }
  build(): AgentInvokeOptions {
    return new AgentInvokeOptions(
      this._kernel,
      this._kernelArguments,
      this._additionalInstructions,
      this._invocationContext
    )
  }
}
