import "@azure/openai/types";
import {
  PostChatCompletionEvent,
  PreChatCompletionEvent,
} from "./ChatCompletionEvents";
import { FunctionInvokedEvent, FunctionInvokingEvent } from "./FnInvokeEvents";
import { PreToolCallEvent } from "./PreToolCallEvent";
import { PromptRenderedEvent, PromptRenderingEvent } from "./PromptEvents";
import { KernelHookEvent } from "./types/KernelHookEvent";
import Predicate from "../ds/Predicate";

/**
 * Represents a hook that can be used to intercept and modify arguments to {@code KernelFunction}s.
 * A {@code KernelHook} implements a {@code Predicate} that determines if the hook is interested in
 * a particular event, and a {@code Function} that can be used to modify the event. The
 *
 * @param <T> The type of the event that the hook is interested in
 */
export abstract class KernelHook<
  T extends KernelHookEvent
> extends Predicate<KernelHookEvent> {
  static DEFAULT_PRIORITY = 50;

  execute(t: T): T {
    return t;
  }

  getPriority(): number {
    return KernelHook.DEFAULT_PRIORITY;
  }
}

export abstract class FunctionInvokingHook<T> extends KernelHook<
  FunctionInvokingEvent<T>
> {
  override test(argumentz: KernelHookEvent): boolean {
    return FunctionInvokingEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class FunctionInvokedHook<T> extends KernelHook<
  FunctionInvokedEvent<T>
> {
  override test(argumentz: KernelHookEvent): boolean {
    return FunctionInvokedEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class PromptRenderingHook extends KernelHook<PromptRenderingEvent> {
  override test(argumentz: KernelHookEvent): boolean {
    return PromptRenderingEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class PreToolCallHook extends KernelHook<PreToolCallEvent> {
  override test(argumentz: KernelHookEvent): boolean {
    return PreToolCallEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class PromptRenderedHook extends KernelHook<PromptRenderedEvent> {
  override test(argumentz: KernelHookEvent): boolean {
    return PromptRenderedEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class PreChatCompletionHook extends KernelHook<PreChatCompletionEvent> {
  override test(argumentz: KernelHookEvent): boolean {
    return PreChatCompletionEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class PostChatCompletionHook extends KernelHook<PostChatCompletionEvent> {
  override test(argumentz: KernelHookEvent): boolean {
    return PostChatCompletionEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}
