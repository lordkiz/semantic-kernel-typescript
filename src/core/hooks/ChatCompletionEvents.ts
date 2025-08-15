import { ChatHistory } from "../services"
import { KernelHookEvent } from "./types/KernelHookEvent"

/**
 * Represents a KernelHookEvent that is raised before a chat completion is invoked.
 */
export class PreChatCompletionEvent<OptionsType> implements KernelHookEvent<OptionsType> {
  private _options: OptionsType
  private _chatHistory: ChatHistory

  constructor(options: OptionsType, chatHistory: ChatHistory) {
    this._options = options
    this._chatHistory = chatHistory
  }

  get options() {
    return this._options
  }

  get chatHistory() {
    return this._chatHistory
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
