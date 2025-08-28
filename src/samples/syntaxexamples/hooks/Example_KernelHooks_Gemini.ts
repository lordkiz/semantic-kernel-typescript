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
