---
sidebar_position: 2
---

# Hooks Workflow

To use hooks in a workflow, first let us define a set of simple hooks to use within our workflow.

### Sample Hooks

```ts
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
```

With our hooks created, we can now go ahead and use them.

### Gemini

```ts
import { GoogleGenAI } from "@google/genai"
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import {
  GeminiChatCompletion,
  GeminiChatCompletionPromptExecutionSettings,
} from "@semantic-kernel-typescript/gemini/chatCompletion"
import {
  CancellationHookHandler,
  InvokedHook,
  PostchatHookHandler,
  PrechatHookHandler,
  PreHook,
  PromptRenderedHookHandler,
  PromptRenderingHookHandler,
  RemovePreHook,
  WriterInvokedHookHandler,
} from "./hooks"

const GEMINI_API_KEY = "GEMINI_API_KEY"
const MODEL_ID = "gemini-2.0-flash"

// Initialize GoogleGenAI client
const client = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
})

const main = async () => {
  const chatCompletionService = GeminiChatCompletion.Builder()
    .withModelId(MODEL_ID)
    .withClient(client)
    .build()

  const kernelBuilder = Kernel.Builder().withAIService(GeminiChatCompletion, chatCompletionService)

  await getUsageAsync(kernelBuilder.build())
  await getRenderedPromptAsync(kernelBuilder.build())
  await changingResultAsync(kernelBuilder.build())
  await beforeInvokeCancellationAsync(kernelBuilder.build())
  await chatCompletionHook(kernelBuilder.build())
}

/** Demonstrate using kernel invocation-hooks to monitor usage: */
const getUsageAsync = async (kernel: Kernel) => {
  console.log("\n======== Get Usage Data ========\n")

  const functionPrompt = "Write a random paragraph about: {{$input}}."

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Excuse")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<GeminiChatCompletionPromptExecutionSettings>()
        .maxOutputTokens(1000)
        .temperature(0.4)
        .topP(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PreHook())

  // Demonstrate pattern for removing a handler.
  kernel.getGlobalKernelHooks().addHook(new RemovePreHook(), "pre-invoke-removed")
  kernel.getGlobalKernelHooks().removeHook("pre-invoke-removed")

  kernel.getGlobalKernelHooks().addHook(new InvokedHook())

  // Invoke prompt to trigger execution hooks.
  const input = "I missed the F1 final race"
  const result = await kernel.invoke(
    excuseFunction.build(),
    KernelArguments.Builder().withInput(input).build(),
    InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
  )
  console.log("Function result: ", result.result)
}

/**  Demonstrate using kernel-hooks to around prompt rendering: */
const getRenderedPromptAsync = async (kernel: Kernel) => {
  console.log("\n======== Get Rendered Prompt ========\n")

  const functionPrompt = "Write a random paragraph about: {{input}} in the style of {{style}}."

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Excuse")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<GeminiChatCompletionPromptExecutionSettings>()
        .maxOutputTokens(1000)
        .temperature(0.4)
        .topP(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PromptRenderingHookHandler())
  kernel.getGlobalKernelHooks().addHook(new PromptRenderedHookHandler())

  // Invoke prompt to trigger execution hooks.
  const input = "I missed the F1 final race"
  const result = await kernel.invoke(
    excuseFunction.build(),
    KernelArguments.Builder().withInput(input).build(),
    InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
  )
  console.log("Function result: ", result.result)
}

/** Demonstrate using kernel invocation-hooks to cancel prior to execution: */
const changingResultAsync = async (kernel: Kernel) => {
  console.log("\n======== Cancelling Pipeline Execution - Invoking event ========\n")

  const functionPrompt = "Write a paragraph about: Cancellation"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<GeminiChatCompletionPromptExecutionSettings>()
        .maxOutputTokens(500)
        .temperature(0.4)
        .topP(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new WriterInvokedHookHandler())

  // Invoke prompt to trigger execution hooks.
  const result = await kernel.invoke(
    writerFunction.build(),
    KernelArguments.Builder().build(),
    InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
  )
  console.log("Function result: ", result.result)
}

/** Demonstrate using kernel invocation-hooks to post process result: */
const beforeInvokeCancellationAsync = async (kernel: Kernel) => {
  console.log("\n======== Changing/Filtering Function Result ========\n")

  const functionPrompt = "Write a paragraph about Handlers"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<GeminiChatCompletionPromptExecutionSettings>()
        .maxOutputTokens(1000)
        .temperature(0.4)
        .topP(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new CancellationHookHandler())

  // Invoke prompt to trigger execution hooks.
  try {
    const result = await kernel.invoke(
      writerFunction.build(),
      KernelArguments.Builder().build(),
      InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
    )
    console.log("Function Result: ", result.result)
  } catch (e: any) {
    console.log("Exception: ", e.message)
  }
}

/** Demonstrate using kernel invocation-hooks to post process result: */
const chatCompletionHook = async (kernel: Kernel) => {
  console.log("\n======== ChatCompletion ========\n")

  const functionPrompt = "Write a paragraph about hats"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<GeminiChatCompletionPromptExecutionSettings>()
        .maxOutputTokens(1000)
        .temperature(0.4)
        .topP(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PrechatHookHandler())
  kernel.getGlobalKernelHooks().addHook(new PostchatHookHandler())

  // Invoke prompt to trigger execution hooks.
  try {
    const result = await kernel.invoke(
      writerFunction.build(),
      KernelArguments.Builder().build(),
      InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
    )
    console.log("Function Result: ", result.result)
  } catch (e: any) {
    console.log("Exception: ", e.message)
  }
}

main()
```

### HuggingFace Models

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { HuggingFaceClient } from "@semantic-kernel-typescript/huggingface"
import {
  HuggingFaceChatCompletionPromptExecutionSettings,
  HuggingFaceTGI,
} from "@semantic-kernel-typescript/huggingface/services"
import {
  CancellationHookHandler,
  InvokedHook,
  PostchatHookHandler,
  PrechatHookHandler,
  PreHook,
  PromptRenderedHookHandler,
  PromptRenderingHookHandler,
  RemovePreHook,
  WriterInvokedHookHandler,
} from "./hooks"

const MODEL_ID = "qwen3-1-7b-wrh"

const client = new HuggingFaceClient({
  baseURL: "https://somewhere.us-east-1.aws.endpoints.huggingface.cloud/v1/",
  apiKey: "hf_XXXX", // inference token
})

const main = async () => {
  const tgi = HuggingFaceTGI.Builder().withModelId(MODEL_ID).withClient(client).build()

  const kernelBuilder = Kernel.Builder().withAIService(HuggingFaceTGI, tgi)

  await getUsageAsync(kernelBuilder.build())
  await getRenderedPromptAsync(kernelBuilder.build())
  await changingResultAsync(kernelBuilder.build())
  await beforeInvokeCancellationAsync(kernelBuilder.build())
  await chatCompletionHook(kernelBuilder.build())
}

/** Demonstrate using kernel invocation-hooks to monitor usage: */
const getUsageAsync = async (kernel: Kernel) => {
  console.log("\n======== Get Usage Data ========\n")

  const functionPrompt = "Write a random paragraph about: {{$input}}."

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Excuse")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<HuggingFaceChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(1000)
        .temperature(0.4)
        .top_p(0.9)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PreHook())

  // Demonstrate pattern for removing a handler.
  kernel.getGlobalKernelHooks().addHook(new RemovePreHook(), "pre-invoke-removed")
  kernel.getGlobalKernelHooks().removeHook("pre-invoke-removed")

  kernel.getGlobalKernelHooks().addHook(new InvokedHook())

  // Invoke prompt to trigger execution hooks.
  const input = "I missed the F1 final race"
  const result = await kernel.invoke(
    excuseFunction.build(),
    KernelArguments.Builder().withInput(input).build(),
    InvocationContext.Builder().withServiceClass(HuggingFaceTGI).build()
  )
  console.log("Function result: ", result.result)
}

/**  Demonstrate using kernel-hooks to around prompt rendering: */
const getRenderedPromptAsync = async (kernel: Kernel) => {
  console.log("\n======== Get Rendered Prompt ========\n")

  const functionPrompt = "Write a random paragraph about: {{input}} in the style of {{style}}."

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Excuse")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<HuggingFaceChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(1000)
        .temperature(0.4)
        .top_p(0.9)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PromptRenderingHookHandler())
  kernel.getGlobalKernelHooks().addHook(new PromptRenderedHookHandler())

  // Invoke prompt to trigger execution hooks.
  const input = "I missed the F1 final race"
  const result = await kernel.invoke(
    excuseFunction.build(),
    KernelArguments.Builder().withInput(input).build(),
    InvocationContext.Builder().withServiceClass(HuggingFaceTGI).build()
  )
  console.log("Function result: ", result.result)
}

/** Demonstrate using kernel invocation-hooks to cancel prior to execution: */
const changingResultAsync = async (kernel: Kernel) => {
  console.log("\n======== Cancelling Pipeline Execution - Invoking event ========\n")

  const functionPrompt = "Write a paragraph about: Cancellation"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<HuggingFaceChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(1000)
        .temperature(0.4)
        .top_p(0.9)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new WriterInvokedHookHandler())

  // Invoke prompt to trigger execution hooks.
  const result = await kernel.invoke(
    writerFunction.build(),
    KernelArguments.Builder().build(),
    InvocationContext.Builder().withServiceClass(HuggingFaceTGI).build()
  )
  console.log("Function result: ", result.result)
}

/** Demonstrate using kernel invocation-hooks to post process result: */
const beforeInvokeCancellationAsync = async (kernel: Kernel) => {
  console.log("\n======== Changing/Filtering Function Result ========\n")

  const functionPrompt = "Write a paragraph about Handlers"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<HuggingFaceChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(1000)
        .temperature(0.4)
        .top_p(0.9)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new CancellationHookHandler())

  // Invoke prompt to trigger execution hooks.
  try {
    const result = await kernel.invoke(
      writerFunction.build(),
      KernelArguments.Builder().build(),
      InvocationContext.Builder().withServiceClass(HuggingFaceTGI).build()
    )
    console.log("Function Result: ", result.result)
  } catch (e: any) {
    console.log("Exception: ", e.message)
  }
}

/** Demonstrate using kernel invocation-hooks to post process result: */
const chatCompletionHook = async (kernel: Kernel) => {
  console.log("\n======== ChatCompletion ========\n")

  const functionPrompt = "Write a paragraph about hats"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<HuggingFaceChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(1000)
        .temperature(0.4)
        .top_p(0.9)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PrechatHookHandler())
  kernel.getGlobalKernelHooks().addHook(new PostchatHookHandler())

  // Invoke prompt to trigger execution hooks.
  try {
    const result = await kernel.invoke(
      writerFunction.build(),
      KernelArguments.Builder().build(),
      InvocationContext.Builder().withServiceClass(HuggingFaceTGI).build()
    )
    console.log("Function Result: ", result.result)
  } catch (e: any) {
    console.log("Exception: ", e.message)
  }
}

main()
```

### OpenAI

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import {
  OpenAIChatCompletion,
  OpenAIChatCompletionPromptExecutionSettings,
} from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"
import {
  CancellationHookHandler,
  InvokedHook,
  PostchatHookHandler,
  PrechatHookHandler,
  PreHook,
  PromptRenderedHookHandler,
  PromptRenderingHookHandler,
  RemovePreHook,
  WriterInvokedHookHandler,
} from "./hooks"

const OPENAI_API_KEY = "OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1"

// Initialize  client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const main = async () => {
  const openAIChatCompletionService = OpenAIChatCompletion.Builder()
    .withModelId(MODEL_ID)
    .withClient(client)
    .build()

  const kernelBuilder = Kernel.Builder().withAIService(
    OpenAIChatCompletion,
    openAIChatCompletionService
  )

  await getUsageAsync(kernelBuilder.build())
  await getRenderedPromptAsync(kernelBuilder.build())
  await changingResultAsync(kernelBuilder.build())
  await beforeInvokeCancellationAsync(kernelBuilder.build())
  await chatCompletionHook(kernelBuilder.build())
}

/** Demonstrate using kernel invocation-hooks to monitor usage: */
const getUsageAsync = async (kernel: Kernel) => {
  console.log("\n======== Get Usage Data ========\n")

  const functionPrompt = "Write a random paragraph about: {{$input}}."

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Excuse")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(100)
        .temperature(0.4)
        .top_p(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PreHook())

  // Demonstrate pattern for removing a handler.
  kernel.getGlobalKernelHooks().addHook(new RemovePreHook(), "pre-invoke-removed")
  kernel.getGlobalKernelHooks().removeHook("pre-invoke-removed")

  kernel.getGlobalKernelHooks().addHook(new InvokedHook())

  // Invoke prompt to trigger execution hooks.
  const input = "I missed the F1 final race"
  const result = await kernel.invoke(
    excuseFunction.build(),
    KernelArguments.Builder().withInput(input).build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )
  console.log("Function result: ", result.result)
}

/**  Demonstrate using kernel-hooks to around prompt rendering: */
const getRenderedPromptAsync = async (kernel: Kernel) => {
  console.log("\n======== Get Rendered Prompt ========\n")

  const functionPrompt = "Write a random paragraph about: {{input}} in the style of {{style}}."

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Excuse")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(100)
        .temperature(0.4)
        .top_p(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PromptRenderingHookHandler())
  kernel.getGlobalKernelHooks().addHook(new PromptRenderedHookHandler())

  // Invoke prompt to trigger execution hooks.
  const input = "I missed the F1 final race"
  const result = await kernel.invoke(
    excuseFunction.build(),
    KernelArguments.Builder().withInput(input).build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )
  console.log("Function result: ", result.result)
}

/** Demonstrate using kernel invocation-hooks to cancel prior to execution: */
const changingResultAsync = async (kernel: Kernel) => {
  console.log("\n======== Cancelling Pipeline Execution - Invoking event ========\n")

  const functionPrompt = "Write a paragraph about: Cancellation"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(100)
        .temperature(0.4)
        .top_p(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new WriterInvokedHookHandler())

  // Invoke prompt to trigger execution hooks.
  const result = await kernel.invoke(
    writerFunction.build(),
    KernelArguments.Builder().build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )
  console.log("Function result: ", result.result)
}

/** Demonstrate using kernel invocation-hooks to post process result: */
const beforeInvokeCancellationAsync = async (kernel: Kernel) => {
  console.log("\n======== Changing/Filtering Function Result ========\n")

  const functionPrompt = "Write a paragraph about Handlers"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(100)
        .temperature(0.4)
        .top_p(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new CancellationHookHandler())

  // Invoke prompt to trigger execution hooks.
  try {
    const result = await kernel.invoke(
      writerFunction.build(),
      KernelArguments.Builder().build(),
      InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
    )
    console.log("Function Result: ", result.result)
  } catch (e: any) {
    console.log("Exception: ", e.message)
  }
}

/** Demonstrate using kernel invocation-hooks to post process result: */
const chatCompletionHook = async (kernel: Kernel) => {
  console.log("\n======== ChatCompletion ========\n")

  const functionPrompt = "Write a paragraph about hats"

  const writerFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(functionPrompt)
    .withName("Writer")
    .withExecutionSettings(
      PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
        .max_completion_tokens(100)
        .temperature(0.4)
        .top_p(1)
        .build()
    )

  kernel.getGlobalKernelHooks().addHook(new PrechatHookHandler())
  kernel.getGlobalKernelHooks().addHook(new PostchatHookHandler())

  // Invoke prompt to trigger execution hooks.
  try {
    const result = await kernel.invoke(
      writerFunction.build(),
      KernelArguments.Builder().build(),
      InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
    )
    console.log("Function Result: ", result.result)
  } catch (e: any) {
    console.log("Exception: ", e.message)
  }
}

main()
```
