import KernelArguments from "../functions/KernelArguments"
import KernelFunction from "../functions/KernelFunction"
import { KernelHookEvent } from "./types/KernelHookEvent"

abstract class PromptREvent implements KernelHookEvent<any> {
  private fn: KernelFunction<unknown>
  private kernelArguments: KernelArguments | undefined

  constructor(fn: KernelFunction<unknown>, kernelArguments?: KernelArguments) {
    this.fn = fn
    this.kernelArguments = kernelArguments
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

export class PromptRenderingEvent extends PromptREvent {}

export class PromptRenderedEvent extends PromptREvent {
  private prompt: string | undefined

  constructor(fn: KernelFunction<unknown>, kernelArguments: KernelArguments, prompt: string) {
    super(fn, kernelArguments)
    this.prompt = prompt
  }
  getPrompt() {
    return this.prompt
  }
}
