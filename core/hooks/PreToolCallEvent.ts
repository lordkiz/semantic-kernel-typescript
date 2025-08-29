import { KernelArguments } from "../functions/KernelArguments"
import { KernelFunction } from "../functions/KernelFunction"
import { KernelHookEvent } from "./types/KernelHookEvent"

/**
 * Represents a KernelHookEvent that is raised before a tool call is invoked.
 */
export class PreToolCallEvent implements KernelHookEvent<any> {
  private functionName: string
  private kernelArguments: KernelArguments
  private fn: KernelFunction<any>

  constructor(fnName: string, kernelArguments: KernelArguments, fn: KernelFunction<any>) {
    this.functionName = fnName
    this.kernelArguments = kernelArguments
    this.fn = fn
  }
  get options() {
    throw new Error("Method not implemented.")
  }

  getFunction() {
    return this.fn
  }

  getArguments() {
    return this.kernelArguments
  }
}
