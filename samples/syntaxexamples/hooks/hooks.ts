import {
  FunctionInvokedEvent,
  FunctionInvokingEvent,
  PostChatCompletionEvent,
  PreChatCompletionEvent,
  PromptRenderedEvent,
  PromptRenderingEvent,
} from "@semantic-kernel-typescript/core/hooks"
import {
  FunctionInvokedHook,
  FunctionInvokingHook,
  PostChatCompletionHook,
  PreChatCompletionHook,
  PromptRenderedHook,
  PromptRenderingHook,
} from "@semantic-kernel-typescript/core/hooks/KernelHook"
import { FunctionResult } from "@semantic-kernel-typescript/core/orchestration"

/** A simple FunctionInvokingHook */
export class PreHook extends FunctionInvokingHook<string> {
  override execute(event: FunctionInvokingEvent<string>): FunctionInvokingEvent<string> {
    console.log(event.getFunction().getName() + " : Pre Execution Handler - Triggered")
    return event
  }
}

/** A simple FunctionInvokingHook meant to demonstrate removing hook */
export class RemovePreHook extends FunctionInvokingHook<string> {
  override execute(event: FunctionInvokingEvent<string>): FunctionInvokingEvent<string> {
    console.log(event.getFunction().getName() + " : Pre Execution Handler - Should not trigger")
    return event
  }
}

/** A simple FunctionInvokedHook */
export class InvokedHook extends FunctionInvokedHook<string> {
  override execute(event: FunctionInvokedEvent<string>): FunctionInvokedEvent<string> {
    console.log(
      event.getFunction().getName() +
        " : Post Execution Handler - Usage: " +
        JSON.stringify(event.result.metadata.getUsage(), null, 2)
    )
    return event
  }
}

/** A simple PromptRenderingHook meant to demonstrate overwritting arguments */
export class PromptRenderingHookHandler extends PromptRenderingHook {
  override execute(event: PromptRenderingEvent): PromptRenderingEvent {
    console.log(event.getFunction().getName() + " : Prompt Rendering Handler - Triggered")

    event.getArguments()?.set("style", "Seinfeld")
    return event
  }
}

/** A simple PromptRenderedHook meant to demonstrate overwritting prompt */
export class PromptRenderedHookHandler extends PromptRenderedHook {
  override execute(event: PromptRenderedEvent): PromptRenderedEvent {
    console.log(
      event.getFunction().getName() +
        " : Prompt Rendered Handler - Triggered" +
        ` using ${event.getArguments()?.get("style")?.value} style`
    )

    const prompt = event.getPrompt() + "\nUSE SHORT, CLEAR, COMPLETE SENTENCES."
    return new PromptRenderedEvent(event.getFunction(), event.getArguments()!, prompt)
  }
}

/** A simple FunctionInvokedHook to demonstate replacing result*/
export class WriterInvokedHookHandler extends FunctionInvokedHook<string> {
  override execute(event: FunctionInvokedEvent<string>): FunctionInvokedEvent<string> {
    let result = event.result.result
    result = result.replaceAll(/[aeiouAEIOU0-9]/g, "*")

    return new FunctionInvokedEvent(
      event.getFunction(),
      event.getArguments()!,
      new FunctionResult<string>(result, event.result.metadata)
    )
  }
}

/** A simple FunctionInvokedHook to demonstate Cancellation */
export class CancellationHookHandler extends FunctionInvokingHook<string> {
  override execute(event: FunctionInvokedEvent<string>): FunctionInvokedEvent<string> {
    console.log(event.getFunction().getName() + " : FunctionInvoking - Cancelling before execution")
    throw new Error("Cancelled")
  }
}

/** A simple FunctionInvokedHook to demonstate PrechatCompletion */
export class PrechatHookHandler extends PreChatCompletionHook {
  override execute(event: PreChatCompletionEvent<any>): PreChatCompletionEvent<any> {
    const chatHistory = event.chatHistory
    chatHistory.addSystemMessage("Use upper case text when responding to the prompt.")

    return new PreChatCompletionEvent(event.options, chatHistory)
  }
}

/** A simple FunctionInvokedHook to demonstate PostchatCompletion */
export class PostchatHookHandler extends PostChatCompletionHook {
  override execute(event: PostChatCompletionEvent): PostChatCompletionEvent {
    console.log("Chat completion: ")
    return event
  }
}
