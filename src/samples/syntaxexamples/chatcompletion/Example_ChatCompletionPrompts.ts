import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelFunctionFromPrompt } from "@semantic-kernel-typescript/core/functions"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"

const main = async () => {
  const client = new OpenAI({
    apiKey: "sk-XXXX",
  })

  const chatCompletionService = OpenAIChatCompletion.Builder()
    .withModelId("gpt-4.1")
    .withClient(client)
    .build()

  const kernel = Kernel.Builder().withAIService(OpenAIChatCompletion, chatCompletionService).build()

  const chatPrompt = `
            <message role="user">What is Seattle?</message>
            <message role="system">Respond with JSON.</message>
            `
  const chatSemanticFunction = KernelFunctionFromPrompt.Builder<string>()
    .withTemplate(chatPrompt)
    .build()

  const chatPromptResult = await kernel.invoke(chatSemanticFunction)

  console.log("Chat Prompt:")
  console.log(chatPrompt)
  console.log("Chat Prompt Result:")
  console.log(chatPromptResult.getResult())

  // console.log("Chat Prompt Result:");
}

main()
