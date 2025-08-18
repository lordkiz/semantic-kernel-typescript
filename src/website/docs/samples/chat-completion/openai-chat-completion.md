---
sidebar_position: 6
---

# OpenAI Chat Completion

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import { ChatCompletionService, ChatHistory } from "@semantic-kernel-typescript/core/services"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"
import { lastValueFrom } from "rxjs"

const client = new OpenAI({
  apiKey: "sk-XXX",
})

const messageOutput = (chatHistory: ChatHistory) => {
  const message = chatHistory.getLastMessage()
  console.log(message?.AuthorRole + ": " + message?.content)
  console.log("------------------------")
}

const kernel = Kernel.Builder().build()

const GPTReply = async (chatGPT: ChatCompletionService, chatHistory: ChatHistory) => {
  const reply = await lastValueFrom(chatGPT.getChatMessageContentsAsync(chatHistory, kernel))
  const message = reply.map((v) => v.content).join("")
  chatHistory.addAssistantMessage(message)
}

console.log("======== Open AI - ChatGPT ========")

const main = async () => {
  const chatGPT = OpenAIChatCompletion.Builder().withModelId("gpt-4.1").withClient(client).build()

  console.log("Chat content:")
  console.log("------------------------")

  const chatHistory = new ChatHistory("You are a librarian, expert about books")
  // First user message
  chatHistory.addUserMessage("Hi, I'm looking for book suggestions")
  messageOutput(chatHistory)

  await GPTReply(chatGPT, chatHistory)
  messageOutput(chatHistory)

  chatHistory.addUserMessage(
    "I love history and philosophy, I'd like to learn something new about Greece, any suggestion"
  )
  messageOutput(chatHistory)

  await GPTReply(chatGPT, chatHistory)
  messageOutput(chatHistory)
}

main()
```
