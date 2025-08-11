import KernelArguments from "../functions/KernelArguments"
import KernelFunction from "../functions/KernelFunction"
import FunctionResult from "../orchestration/FunctionResult"
import { KernelHookEvent } from "./types/KernelHookEvent"

abstract class FnInvokeEvent<T> implements KernelHookEvent<unknown> {
  private fn: KernelFunction<T>
  private kernelArguments: KernelArguments<any> | undefined

  constructor(fn: KernelFunction<T>, kernelArguments?: KernelArguments<any>) {
    this.fn = fn
    this.kernelArguments = kernelArguments
  }
  get options(): unknown {
    throw new Error("Method not implemented.")
  }

  getFunction() {
    return this.fn
  }

  getArguments() {
    return this.kernelArguments
  }
}

export class FunctionInvokingEvent<T> extends FnInvokeEvent<T> {}

export class FunctionInvokedEvent<T> extends FnInvokeEvent<T> {
  private _result: FunctionResult<T>

  constructor(fn: KernelFunction<T>, kernelArguments: KernelArguments, result: FunctionResult<T>) {
    super(fn, kernelArguments)
    this._result = result
  }
  get result() {
    return this._result
  }
}
