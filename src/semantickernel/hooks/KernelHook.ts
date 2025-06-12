import "@azure/openai/types";
import {
  PostChatCompletionEvent,
  PreChatCompletionEvent,
} from "./ChatCompletionEvents";
import { FunctionInvokedEvent, FunctionInvokingEvent } from "./FnInvokeEvents";
import { PreToolCallEvent } from "./PreToolCallEvent";
import { PromptRenderedEvent, PromptRenderingEvent } from "./PromptEvents";
import { KernelHookEvent } from "./types/KernelHookEvent";

abstract class Predicate<T> {
  abstract test(t: T): boolean;
}

export abstract class KernelHook<
  T extends KernelHookEvent
> extends Predicate<KernelHookEvent> {
  getPriority(): number {
    return 50;
  }
}

export abstract class FunctionInvokingHook extends KernelHook<
  FunctionInvokingEvent<unknown>
> {
  override test(argumentz: KernelHookEvent): boolean {
    return FunctionInvokingEvent.prototype.isPrototypeOf(
      argumentz.constructor.prototype
    );
  }
}

export abstract class FunctionInvokedHook extends KernelHook<
  FunctionInvokedEvent<unknown>
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
