---
sidebar_position: 1
---

# Kernel

The Kernel is the central orchestrator in Semantic Kernel that manages services, plugins, and execution flow.

## Overview

The Kernel acts as the main entry point and coordinator for AI operations in Semantic Kernel applications.

The kernel:

- Serves as the core of the Semantic Kernel SDK.

- Manages all services (AI services, logging, HTTP clients) and plugins essential for your application.

- Provides a unified entry point—whether running prompts or custom code, the kernel is always available to retrieve needed components.

This centralization simplifies configuration, observability, and monitoring of AI agents and their workflows.

## Lifecycle: How the Kernel Processes a Prompt

When you invoke a prompt via the kernel, it orchestrates the following sequence:

- Selects the most appropriate AI service.

- Builds the prompt using a template.

- Sends the prompt to the specified AI service.

- Receives and parses the AI’s response.

- Returns the response to your application.

Through this flow, you can attach events or middleware—for logging, status tracking, or responsible AI enforcement—at any stage.

## Building the Kernel: Services & Plugins

### Components

#### Services

Include AI interfaces (like chat completion) or utility services (e.g., logging, HTTP clients). Modeled after the .NET Service Provider pattern for cross-language support.
Microsoft Learn

#### Plugins

Encapsulate work functions—e.g., data retrieval or API operations—that AI services and prompt templates may invoke.

## Key Concepts

### 1. Service Registration

The Kernel manages various services through a service selector:

```ts
// Registering a HuggingFace TGI service
const tgi = HuggingFaceTGI.Builder()
  .withModelId("qwen3-1-7b-wrh")
  .withClient(
    new HuggingFaceClient({
      baseURL: "https://somewhere.us-east-1.aws.endpoints.huggingface.cloud/v1/",
      apiKey: "hf_XXXX", // inference token
    })
  )
  .build()

const kernel = Kernel.Builder().withAIService(HuggingFaceTGI, tgi).build()
```

### 2. Plugin Management

Plugins extend the Kernel's capabilities with additional functions:

```ts
const myPlugin = KernelPluginFactory.createFromObject(new MyPlugin(), "MyPlugin")

const kernel = Kernel.Builder().withPlugin(conversationSummaryPlugin).build()
```

### 3. Function Invocation

The Kernel enables execution of both native and semantic functions:

```ts
const myFunction = KernelFunctionFromPrompt.Builder()
  .withTemplate("My Function prompt")
  .withName("myFunction")
  .withExecutionSettings(
    PromptExecutionSettings.Builder<GeminiChatCompletionPromptExecutionSettings>()
      .maxOutputTokens(1000)
      .temperature(0.4)
      .topP(1)
      .build()
  )
  .build()

const result = await kernel.invoke(
  myFunction,
  KernelArguments.Builder().withInput("My Function").build(),
  InvocationContext.Builder().withServiceClass(GeminiChatCompletion).build()
)
```
