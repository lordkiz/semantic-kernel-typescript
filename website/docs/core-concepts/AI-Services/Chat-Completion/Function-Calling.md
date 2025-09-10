---
sidebar_position: 3
---

# Function Calling

One of the most powerful aspects of chat completion is its ability to call functions directly from the model. This makes it possible to build chatbots that interact with your existing code—automating business workflows, generating code snippets, and more.

Semantic Kernel streamlines this process by automatically describing your functions and parameters to the model, while also managing the communication loop between the model and your code.

That said, it is important to understand how function calling works under the hood. This knowledge helps you optimize your implementation and fully leverage the feature.

When you make a request to a model with function calling enabled, Semantic Kernel performs the following steps:

| Step                                         | Description                                                                                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serialize functions                          | All of the available functions (and its input parameters) in the kernel are serialized using JSON schema.                                                                                               |
| Send the messages and functions to the model | The serialized functions (and the current chat history) are sent to the model as part of the input.                                                                                                     |
| Model processes the input                    | The model processes the input and generates a response. The response can either be a chat message or one or more function calls.                                                                        |
| Handle the response                          | If the response is a chat message, it is returned to the caller. If the response is a function call, however, Semantic Kernel extracts the function name and its parameters.                            |
| Invoke the function                          | The extracted function name and parameters are used to invoke the function in the kernel.                                                                                                               |
| Return the function result                   | The result of the function is then sent back to the model as part of the chat history. Steps 2-6 are then repeated until the model returns a chat message or the max iteration number has been reached. |

## Example: Checking the weather

```ts
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

const main = async () => {
  const openAIChatCompletion = OpenAIChatCompletion.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const helperPlugin = KernelPluginFactory.createFromObject(
    new HelperFunctions(),
    "HelperFunctions"
  )

  let kernel = Kernel.Builder()
    .withAIService(OpenAIChatCompletion, openAIChatCompletion)
    .withPlugin(helperPlugin)
    .build()

  console.log("======== Example 1: Use automated function calling ========")

  const func = KernelFunctionFromPrompt.Builder()
    .withTemplate(
      "Given the current time of day and weather, what is the likely color of the sky in Boston?"
    )
    .withExecutionSettings(
      PromptExecutionSettings.Builder<ChatCompletionCreateParams>()
        .temperature(0.4)
        .top_p(1)
        .max_completion_tokens(100)
        .build()
    )
    .build()

  const invocationContext = InvocationContext.Builder()
    .withServiceClass(OpenAIChatCompletion)
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
      openAIChatCompletion.getChatMessageContentsAsync(
        chatHistory,
        kernel,
        InvocationContext.Builder<ChatCompletionCreateParams>()
          .withServiceClass(OpenAIChatCompletion)
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
          InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
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
}

main()
```
