import { KernelHookEvent } from "./types/KernelHookEvent"

/**
 * Represents a KernelHookEvent that is raised before a chat completion is invoked.
 */
export class PreChatCompletionEvent<OptionsType> implements KernelHookEvent<OptionsType> {
  private options: OptionsType

  constructor(options: OptionsType) {
    this.options = options
  }

  getOptions() {
    return this.options
  }
}

/**
 * Represents a KernelHookEvent that is raised after a chat completion is invoked.
 */
export class PostChatCompletionEvent implements KernelHookEvent<undefined> {
  getOptions() {
    return undefined
  }
}
