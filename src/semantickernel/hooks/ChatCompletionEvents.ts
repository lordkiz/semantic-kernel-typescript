import OpenAI from "openai";
import { KernelHookEvent } from "./types/KernelHookEvent";

/**
 * Represents a KernelHookEvent that is raised before a chat completion is invoked.
 */
export class PreChatCompletionEvent implements KernelHookEvent {
  private options: OpenAI.ChatCompletionCreateParams;

  constructor(options: OpenAI.ChatCompletionCreateParams) {
    this.options = options;
  }

  getOptions() {
    return this.options;
  }
}

/**
 * Represents a KernelHookEvent that is raised after a chat completion is invoked.
 */
export class PostChatCompletionEvent implements KernelHookEvent {
  private chatCompletions: OpenAI.ChatCompletion;

  constructor(chatCompletions: OpenAI.ChatCompletion) {
    this.chatCompletions = chatCompletions;
  }

  getChatCompletions() {
    return this.chatCompletions;
  }
}
