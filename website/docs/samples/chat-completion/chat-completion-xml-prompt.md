---
sidebar_position: 1
---

# Using XML Chat prompts

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"

const main = async () => {
  const client = new OpenAI({
    apiKey: "sk-XXX",
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

  const kernelArguments = KernelArguments.Builder().build()

  const invocationContext = InvocationContext.Builder()
    .withServiceClass(OpenAIChatCompletion)
    .build()

  const chatPromptResult = await kernel.invoke(
    chatSemanticFunction,
    kernelArguments,
    invocationContext
  )

  console.log("Chat Prompt:")
  console.log(chatPrompt)

  console.log("Chat Prompt Result:")
  console.log(chatPromptResult.result)
}

main()
```
