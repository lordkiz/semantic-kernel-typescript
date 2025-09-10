---
sidebar_position: 1
---

# Overview

With chat completion, you can simulate a back-and-forth conversation with an AI agent. This is of course useful for creating chat bots, but it can also be used for creating autonomous agents that can complete business processes, generate code, and more. As the primary model type provided by OpenAI, Google, Mistral, Facebook, and others, chat completion is the most common AI service that you will add to your Semantic Kernel project.

When picking out a chat completion model, you will need to consider the following:

- What modalities does the model support (e.g., text, image, audio, etc.)?
- Does it support function calling?
- How fast does it receive and generate tokens?
- How much does each token cost?

You can create instances of the chat completion service directly and either add them to a kernel or use them directly in your code without injecting them into the kernel. The following code shows how to create a chat completion service and add it to the kernel.

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"

const client = new OpenAI({
  apiKey: "sk-XXX",
})

const chatCompletionService = OpenAIChatCompletion.Builder()
  .withModelId("gpt-4.1")
  .withClient(client)
  .build()

const kernel = Kernel.Builder().withAIService(OpenAIChatCompletion, chatCompletionService).build()
```

## Retrieving chat completion services

Once you've added chat completion services to your kernel, you can retrieve them using the get service method. Below is an example of how you can retrieve a chat completion service from the kernel.

```ts
const chatCompletionService: ChatCompletionService = kernel.getService(
  OpenAIChatCompletion
) as ChatCompletionService
```

## Using chat completion services

Now that you have a chat completion service, you can use it to generate responses from an AI agent.

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFromPrompt,
} from "@semantic-kernel-typescript/core/functions"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"

const chatPrompt = `
            <message role="user">What is Seattle?</message>
            <message role="system">Respond with JSON.</message>
            `
const chatSemanticFunction = KernelFunctionFromPrompt.Builder<string>()
  .withTemplate(chatPrompt)
  .build()

const kernelArguments = KernelArguments.Builder().build()

const invocationContext = InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()

const chatPromptResult = await kernel.invoke(
  chatSemanticFunction,
  kernelArguments,
  invocationContext
)

console.log("Chat Prompt Result:")
console.log(chatPromptResult.result)
```
