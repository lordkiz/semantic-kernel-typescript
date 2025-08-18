---
sidebar_position: 1
---

# Quick Start

Semantic Kernel Typescript (SKT) is an SDK that lets you easily combine AI models (like OpenAI, Gemini, Hugging Face models) with your Typescript applications. With SKT, you can create semantic functions (prompts), integrate plugins, and orchestrate AI workflows.

## Installation

```bash
npm install @semantic-kernel-typescript/core
```

SKT currently supports out of the box implementations for OpenAI, Gemini and HuggingFace chat completion models. However, you can use `@semantic-kernel-typescript/core` to build your own workflow from scratch.

To use the inbuilt implementations, add the packages:

1. #### OpenAI

```bash
npm install @semantic-kernel-typescript/openai openai
```

2. #### Gemini

```bash
npm install @semantic-kernel-typescript/gemini @google/genai
```

3. #### HuggingFace models

```bash
npm install @semantic-kernel-typescript/huggingface
```

4. #### Semantic Kernel Typescript Agent package

```bash
npm install @semantic-kernel-typescript/agents
```

## Writing Your First Console App

```ts
// imports
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  InvocationContext,
  InvocationReturnMode,
  PromptExecutionSettings,
  ToolCallBehavior,
} from "@semantic-kernel-typescript/core/orchestration"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import { AuthorRole, ChatHistory } from "@semantic-kernel-typescript/core/services"
import {
  OpenAIChatCompletion,
  OpenAIChatCompletionPromptExecutionSettings,
} from "@semantic-kernel-typescript/openai/chatcompletion"
import readline from "node:readline"
import OpenAI from "openai"
import { ChatCompletionCreateParams } from "openai/resources"
import LightsPlugin from "./LightsPlugin" // 👈 Your native plugin. See how to create a native plugin below

// Configuration
const OPENAI_API_KEY = "OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

// Import the LightsPlugin
const lightPlugin = KernelPluginFactory.createFromObject(new LightsPlugin(), "LightsPlugin")

// Create your AI service client
const chatCompletionService = OpenAIChatCompletion.Builder()
  .withClient(client)
  .withModelId(MODEL_ID)
  .build()

// Create a kernel with OpenAI chat completion and plugin
const kernel = Kernel.Builder()
  .withAIService(OpenAIChatCompletion, chatCompletionService)
  .withPlugin(lightPlugin)
  .build()

// create PromptExecution settings to pass config settings to the model
const settings = PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
  .temperature(1)
  .build()

// Enable planning
const invocationContext = InvocationContext.Builder<ChatCompletionCreateParams>()
  .withServiceClass(OpenAIChatCompletion) // 👈 specify which kind of service this context is for
  .withReturnMode(InvocationReturnMode.LAST_MESSAGE_ONLY)
  .withToolCallBehavior(ToolCallBehavior.allowAllKernelFunctions(true))
  .withPromptExecutionSettings(settings)
  .build()

// Create a history to store the conversation
const history = new ChatHistory()

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log("Type your prompt: ")

reader.on("line", async (prompt) => {
  if (prompt.toLowerCase() === "exit") {
    reader.close()
  }

  // Add user input
  history.addUserMessage(prompt)

  chatCompletionService.getChatMessageContentsAsync(history, kernel, invocationContext).subscribe({
    error: (e) => console.error(e),
    next: (response) => {
      for (const result of response) {
        // Print the results
        if (result.AuthorRole == AuthorRole.ASSISTANT && result.content) {
          console.log("Assistant > " + result.content)
        }
        // Add the message from the agent to the chat history
        history.addMessage(result)
      }
    },
  })

  console.log("\n\nType your prompt: ")
})
```

### Creating your Native Plugin

```ts
import {
  DefineKernelFunction,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"

enum Brightness {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export type LightModel = {
  id: number
  name: string
  isOn: boolean
  brightness: Brightness
  color: string
}

export default class LightsPlugin {
  // Mock data for the lights
  lights: Record<number, LightModel> = {}
  constructor() {
    this.lights = {
      1: {
        id: 1,
        name: "Table Lamp",
        isOn: false,
        brightness: Brightness.MEDIUM,
        color: "#FFFFFF",
      },
      2: {
        id: 2,
        name: "Porch light",
        isOn: false,
        brightness: Brightness.HIGH,
        color: "#FF0000",
      },
      3: {
        id: 3,
        name: "Chandelier",
        isOn: true,
        brightness: Brightness.LOW,
        color: "#FFFF00",
      },
    }
  }

  @DefineKernelFunction({
    name: "getLights",
    description: "Gets a list of lights and their current state",
  })
  public getLights(): LightModel[] {
    console.log("Getting lights")
    return Object.values(this.lights)
  }

  @DefineKernelFunction({
    name: "changeState",
    description: "Changes the state of the light",
  })
  public changeState(
    @KernelFunctionParameter({
      name: "model",
      description:
        "The new state of the model to set. Example model: " +
        '{"id":99,"name":"Head Lamp","isOn":false,"brightness":"MEDIUM","color":"#FFFFFF"}',
      required: true,
    })
    model: LightModel
  ): LightModel {
    console.log(
      "Changing light " + model.id + ` with new payload: ${JSON.stringify(model, null, 2)}`
    )
    if (!this.has(model.id)) {
      throw new Error("Light not found")
    }

    this.lights = { ...this.lights, [model.id]: { ...this.get(model.id), ...model } }

    return this.get(model.id)!
  }

  private has(id: number) {
    return !!this.lights[id]
  }

  private get(id: number) {
    return this.lights[id]
  }
}
```

The following back-and-forth chat should be similar to what you see in the console. The function calls have been added below to demonstrate how the AI leverages the plugin behind the scenes.

| Role                      | Message                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| User                      | What is the current state of light with id of 1?                                                                 |
| Assistant (function call) | `LightsPlugin.getLights()`                                                                                       |
| Assistant                 | The current state of the light with id 1 (Table Lamp) is: Power: Off, Brightness: Medium, Color: White (#FFFFFF) |
| User                      | Toggle the on state of the light with id of 1.                                                                   |
| Assistant (function call) | `LightsPlugin.changeState()`                                                                                     |

## Next steps

In this guide, you learned how to quickly get started with Semantic Kernel by building a simple AI agent that can interact with an AI service and run your code. To see more examples and learn how to build more complex AI agents, check out our in-depth samples.
