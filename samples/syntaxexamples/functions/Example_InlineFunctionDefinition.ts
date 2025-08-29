import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFactory,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"
import { ChatCompletionCreateParams } from "openai/resources"

// Configuration
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const main = async () => {
  console.log("======== Inline Function Definition ========")

  const openAIChatCompletion = OpenAIChatCompletion.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const kernel = Kernel.Builder().withAIService(OpenAIChatCompletion, openAIChatCompletion).build()

  const promptTemplate = `
    Generate a creative reason or excuse for the given event.
    Be creative and be funny. Let your imagination run wild.

    Event: I am running late.
    Excuse: I was being held ransom by giraffe gangsters.

    Event: I haven't been to the gym for a year
    Excuse: I've been too busy training my pet dragon.

    Event: {{$input}}
  `

  const excuseFunction = KernelFunctionFromPrompt.Builder()
    .withTemplate(promptTemplate)
    .withExecutionSettings(
      PromptExecutionSettings.Builder<ChatCompletionCreateParams>()
        .temperature(0.4)
        .top_p(1)
        .max_completion_tokens(100)
        .build()
    )
    .build()

  let result = await kernel.invoke(
    excuseFunction,
    KernelArguments.Builder().withInput("I missed the F1 final race").build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  console.log(result.result)

  result = await kernel.invoke(
    excuseFunction,
    KernelArguments.Builder().withInput("sorry I forgot your birthday").build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  console.log(result.result)

  const date = new Date().toUTCString()
  const message = "Translate this date " + date + " to French format"

  const fixedFunction = KernelFunctionFactory.createFromPrompt(message)
    .withExecutionSettings(
      PromptExecutionSettings.Builder<ChatCompletionCreateParams>()
        .max_completion_tokens(100)
        .build()
    )
    .build()

  const fixedFunctionResult = await kernel.invoke(
    fixedFunction,
    undefined,
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  console.log(fixedFunctionResult.result)
}

main()
