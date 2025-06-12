import KernelArguments from "../functions/KernelArguments";
import KernelFunction from "../functions/KernelFunction";
import { KernelHookEvent } from "./types/KernelHookEvent";

/**
 * Represents a KernelHookEvent that is raised before a tool call is invoked.
 */
export class PreToolCallEvent implements KernelHookEvent {
  private functionName: string;
  private kernelArguments: KernelArguments;
  private fn: KernelFunction<unknown>;

  constructor(
    fnName: string,
    kernelArguments: KernelArguments,
    fn: KernelFunction<unknown>
  ) {
    (this.functionName = fnName),
      (this.kernelArguments = kernelArguments),
      (this.fn = fn);
  }
  getFunction() {
    return this.fn;
  }

  getArguments() {
    return this.kernelArguments;
  }
}
