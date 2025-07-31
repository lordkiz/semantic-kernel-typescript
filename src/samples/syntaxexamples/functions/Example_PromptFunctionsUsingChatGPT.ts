import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelArguments, KernelFunctionFactory } from "@semantic-kernel-typescript/core/functions"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"

// Configuration
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const main = async () => {
  console.log("======== Using Chat GPT model for text generation ========")

  const openAIChatCompletion = OpenAIChatCompletion.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const kernel = Kernel.Builder().withAIService(OpenAIChatCompletion, openAIChatCompletion).build()

  const func = KernelFunctionFactory.createFromPrompt(
    "List the two planets closest to '{{$input}}', excluding moons, using bullet points."
  ).build()

  const observable = func.invokeAsync(
    kernel,
    KernelArguments.Builder().withVariable("input", "Jupiter").build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  observable.subscribe({
    next(value) {
      console.log(value.getResult())
    },
  })
}

main()
