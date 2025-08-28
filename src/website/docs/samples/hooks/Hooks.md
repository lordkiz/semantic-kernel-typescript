---
sidebar_position: 1
---

# Defining Kernel Hooks

### What are Hooks?

Hooks in Semantic Kernel Typescript are event-driven interception points that allow developers to observe or modify the behavior of the kernel at key moments—such as before or after function execution, chat completions, tool calls, and prompt rendering. They are a powerful mechanism for implementing cross-cutting concerns, enabling developers to inject custom logic into the execution lifecycle of functions, prompts, and plans. They are the embodiment of the decorator pattern, providing a non-invasive way to add pre- and post-execution behaviors like logging, telemetry, validation, and error handling without polluting the core business logic of the kernel's operations.

The primary value of hooks lies in their ability to offer observability and control. As a semantic function or a native function executes, hooks provide designated points to "listen in" on the process. This allows developers to build robust, production-ready applications by centrally managing concerns that are tangential to the AI operation itself but critical for the application's health. For instance, you can uniformly capture token usage, latency metrics, and AI service errors across all your functions, ensuring your application is both measurable and maintainable.

Semantic Kernel Typescript provides a structured hierarchy of hooks, allowing you to attach logic at the most appropriate level of granularity: from a single function invocation all the way up to the entire kernel.

### Available Hooks

1. **FunctionInvokingHook**: Called just before a function executes. You can inspect and even modify the `KernelArguments` that will be passed to the function. Useful for adding last-minute context, validating inputs, or starting a performance timer.

```ts
class MyFunctionInvokingHook extends FunctionInvokingHook<string> {
  override execute(event: FunctionInvokingEvent<string>): FunctionInvokingEvent<string> {
    console.log(event.getFunction().getName() + " : Pre Execution Handler - Triggered")
    return event
  }
}
```

2. **FunctionInvokedHook**: Called immediately after a function completes successfully. You receive the original arguments and the `FunctionResult`, allowing you to log the output, parse token usage from the metadata, or transform the result.

```ts
class MyFunctionInvokedHook extends FunctionInvokedHook<string> {
  override execute(event: FunctionInvokedEvent<string>): FunctionInvokedEvent<string> {
    console.log(
      event.getFunction().getName() +
        " : Post Execution Handler - Usage: " +
        JSON.stringify(event.result.metadata.getUsage(), null, 2)
    )
    return event
  }
}
```

3. **PromptRenderingHook**: Called before the prompt template is rendered.

```ts
class PromptRenderingHookHandler extends PromptRenderingHook {
  override execute(event: PromptRenderingEvent): PromptRenderingEvent {
    console.log(event.getFunction().getName() + " : Prompt Rendering Handler - Triggered")

    event.getArguments()?.set("style", "Seinfeld")
    return event
  }
}
```

4. **PromptRenderedHook**: Called after the prompt has been successfully rendered. You can inspect the final rendered prompt string, which is useful for logging the exact prompts being sent to the AI models for auditing or debugging purposes. You can also modify the prompt at this point to suit specific needs.

```ts
class PromptRenderedHookHandler extends PromptRenderedHook {
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
```

5. **PreChatCompletionHook**: Called before a chat completion is requested. You are able to access `ChatHistory` and so can inject additional messages. Useful for overriding or adding additional instructions.

```ts
class PrechatHookHandler extends PreChatCompletionHook {
  override execute(event: PreChatCompletionEvent<any>): PreChatCompletionEvent<any> {
    const chatHistory = event.chatHistory
    chatHistory.addSystemMessage("Use upper case text when responding to the prompt.")

    return new PreChatCompletionEvent(event.options, chatHistory)
  }
}
```

6. **PostChatCompletionHook**: Called after chat completion is returned. Use cases include: Log the response, run metrics, or cancel follow-up operations.

```ts
class PostchatHookHandler extends PostChatCompletionHook {
  override execute(event: PostChatCompletionEvent): PostChatCompletionEvent {
    console.log("Chat completion: ")
    return event
  }
}
```

---

In the next pages we will see how to use these hooks within a workflow.
