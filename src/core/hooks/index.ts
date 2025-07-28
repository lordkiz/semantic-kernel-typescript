import { PostChatCompletionEvent, PreChatCompletionEvent } from "./ChatCompletionEvents"
import { FunctionInvokedEvent, FunctionInvokingEvent } from "./FnInvokeEvents"
import { PreToolCallEvent } from "./PreToolCallEvent"
import { PromptRenderedEvent, PromptRenderingEvent } from "./PromptEvents"

import KernelHooks from "./KernelHooks"

const events = {
  PreChatCompletionEvent,
  PostChatCompletionEvent,
  FunctionInvokingEvent,
  FunctionInvokedEvent,
  PreToolCallEvent,
  PromptRenderingEvent,
  PromptRenderedEvent,
}
export { events, KernelHooks }
