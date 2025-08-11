import { KernelHookEvent } from "./types/KernelHookEvent"

/**
 * Represents a KernelHookEvent that is raised before a chat completion is invoked.
 */
export class PreChatCompletionEvent<OptionsType> implements KernelHookEvent<OptionsType> {
  private _options: OptionsType

  constructor(options: OptionsType) {
    this._options = options
  }

  get options() {
    return this._options
  }
}

/**
 * Represents a KernelHookEvent that is raised after a chat completion is invoked.
 */
export class PostChatCompletionEvent implements KernelHookEvent<undefined> {
  get options() {
    return undefined
  }
}
