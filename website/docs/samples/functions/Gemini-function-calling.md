---
sidebar_position: 4
---

# Gemini Function Calling

```ts
import { GenerateContentConfig, GoogleGenAI } from "@google/genai"
import { Kernel } from "@semantic-kernel-typescript/core"
import { FunctionCallContent } from "@semantic-kernel-typescript/core/contents"
import { AutoFunctionChoiceBehavior } from "@semantic-kernel-typescript/core/functionchoice"
import {
  DefineKernelFunction,
  KernelFunctionFromPrompt,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"
import {
  FunctionResultMetadata,
  InvocationContext,
  InvocationReturnMode,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import { AuthorRole, ChatHistory } from "@semantic-kernel-typescript/core/services"
import { GeminiChatCompletion } from "@semantic-kernel-typescript/gemini/chatCompletion"
import { lastValueFrom } from "rxjs"

// Configuration
const GEMINI_API_KEY = "GEMINI_API_KEY"
const MODEL_ID = "gemini-2.0-flash"

// Initialize GoogleGenAI client
const client = new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
})

class HelperFunctions {
  @DefineKernelFunction({
    name: "currentUtcTime",
    description: "Retrieves the current time in UTC.",
  })
  public currentUtcTime() {
    return new Date().toUTCString()
  }

  @DefineKernelFunction({
    name: "getWeatherForCity",
    description: "Gets the current weather for the specified city",
  })
  public getWeatherForCity(
    @KernelFunctionParameter({ name: "cityName", description: "Name of the city" }) cityName: string
  ) {
    switch (cityName) {
      case "Thrapston":
        return "80 and sunny"
      case "Boston":
        return "61 and rainy"
      case "London":
        return "55 and cloudy"
      case "Miami":
        return "80 and sunny"
      case "Paris":
        return "60 and rainy"
      case "Tokyo":
        return "50 and sunny"
      case "Sydney":
        return "75 and sunny"
      case "Tel Aviv":
        return "80 and sunny"
      default:
        return "31 and snowing"
    }
  }
}

class PetPlugin {
  @DefineKernelFunction({ name: "getPetName", description: "Retrieves the pet for a given ID." })
  public getPetName(
    @KernelFunctionParameter({ name: "petId", description: "The pets id" }) id: string
  ) {
    if (id === "ca2fc6bc-1307-4da6-a009-d7bf88dec37b") {
      return "Snuggles"
    }

    throw new Error("Pet not found")
  }

  @DefineKernelFunction({
    name: "getPetType",
    description: "Retrieves the type of pet for a given ID.",
  })
  public getPetType(
    @KernelFunctionParameter({ name: "petId", description: "The pets id" }) id: string
  ) {
    if (id === "ca2fc6bc-1307-4da6-a009-d7bf88dec37b") {
      return "cat"
    }

    throw new Error("Pet not found")
  }
}

const main = async () => {
  console.log("======== Gemini - Function calling ========")

  const geminiChat = GeminiChatCompletion.Builder().withClient(client).withModelId(MODEL_ID).build()

  const helperPlugin = KernelPluginFactory.createFromObject(
    new HelperFunctions(),
    "HelperFunctions"
  )

  let kernel = Kernel.Builder()
    .withAIService(GeminiChatCompletion, geminiChat)
    .withPlugin(helperPlugin)
    .build()

  console.log("======== Example 1: Use automated function calling ========")

  const func = KernelFunctionFromPrompt.Builder()
    .withTemplate(
      "Given the current time of day and weather, what is the likely color of the sky in Boston?"
    )
    .withExecutionSettings(
      PromptExecutionSettings.Builder<GenerateContentConfig>()
        .temperature(0.4)
        .topP(1)
        .maxOutputTokens(1000)
        .build()
    )
    .build()

  const invocationContext = InvocationContext.Builder()
    .withServiceClass(GeminiChatCompletion)
    .withFunctionChoiceBehavior(new AutoFunctionChoiceBehavior(true, [helperPlugin]))
    .build()

  const result = await kernel.invoke(func, undefined, invocationContext)

  console.log(result.result)
  //
  //
  //
  //
  //
  console.log("\n\n======== Example 2: Use manual function calling ========")

  let chatHistory = new ChatHistory()
  chatHistory.addUserMessage(
    "Given the current time of day and weather, what is the likely color of the sky in Boston?"
  )

  while (true) {
    const messages = await lastValueFrom(
      geminiChat.getChatMessageContentsAsync(
        chatHistory,
        kernel,
        InvocationContext.Builder<GenerateContentConfig>()
          .withServiceClass(GeminiChatCompletion)
          .withFunctionChoiceBehavior(new AutoFunctionChoiceBehavior(false))
          .withReturnMode(InvocationReturnMode.FULL_HISTORY)
          .build()
      )
    )

    chatHistory = new ChatHistory(messages)

    const lastMessage = chatHistory.getLastMessage()

    if (
      !lastMessage ||
      (lastMessage.AuthorRole === AuthorRole.ASSISTANT && !lastMessage.items?.length)
    ) {
      break
    }

    for (const toolCall of lastMessage.items ?? []) {
      if (toolCall instanceof FunctionCallContent) {
        const fn = kernel.getFunction(toolCall.pluginName ?? "", toolCall.functionName)
        if (!fn) {
          continue
        }
        const functionResult = fn.invoke(
          kernel,
          toolCall.kernelArguments,
          InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
        )

        const content = (await functionResult).result as string

        chatHistory.addMessage(
          content,
          AuthorRole.TOOL,
          "utf8",
          FunctionResultMetadata.build(toolCall.id!)
        )
      }
    }
  }

  chatHistory.messages
    .filter((it) => !!it.content)
    .forEach((m) => {
      console.log(m.content)
    })

  //
  //
  //
  //
  //
  console.log("\n\n======== Example 3: Multiple auto function calling  ========")

  const petPlugin = KernelPluginFactory.createFromObject(new PetPlugin(), "PetPlugin")

  kernel = Kernel.Builder()
    .withAIService(GeminiChatCompletion, geminiChat)
    .withPlugin(petPlugin)
    .build()

  chatHistory = new ChatHistory()

  const invocationContext3 = InvocationContext.Builder<GenerateContentConfig>()
    .withServiceClass(GeminiChatCompletion)
    .withFunctionChoiceBehavior(new AutoFunctionChoiceBehavior(true, [petPlugin]))
    .withReturnMode(InvocationReturnMode.FULL_HISTORY)
    .build()

  chatHistory.addUserMessage(
    "What is the name of the pet with id ca2fc6bc-1307-4da6-a009-d7bf88dec37b?"
  )

  let messages = await lastValueFrom(
    geminiChat.getChatMessageContentsAsync(chatHistory, kernel, invocationContext3)
  )

  chatHistory = new ChatHistory(messages)

  console.log(chatHistory.getLastMessage()?.content)

  chatHistory.addMessage("What type of animal are they?", AuthorRole.USER)

  messages = await lastValueFrom(
    geminiChat.getChatMessageContentsAsync(chatHistory, kernel, invocationContext3)
  )

  chatHistory = new ChatHistory(messages)

  console.log(chatHistory.getLastMessage()?.content)
}

main()
```
