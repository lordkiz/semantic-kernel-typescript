---
sidebar_position: 5
---

# HuggingFace Chat Completion

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import { ChatCompletionService } from "@semantic-kernel-typescript/core/services/chatcompletion/ChatCompletionService"
import { ChatHistory } from "@semantic-kernel-typescript/core/services/chatcompletion/ChatHistory"
import { HuggingFaceClient } from "@semantic-kernel-typescript/huggingface"
import { HuggingFaceTGI } from "@semantic-kernel-typescript/huggingface/services"
import { lastValueFrom } from "rxjs"

const client = new HuggingFaceClient({
  baseURL: "https://somewhere.us-east-1.aws.endpoints.huggingface.cloud/v1/",
  apiKey: "hf_XXXX", // inference token
})

const messageOutput = (chatHistory: ChatHistory) => {
  const message = chatHistory.getLastMessage()
  console.log(message?.AuthorRole + ": " + message?.content)
  console.log("------------------------")
}

const kernel = Kernel.Builder().build()

const GPTReply = async (tgiService: ChatCompletionService, chatHistory: ChatHistory) => {
  const reply = await lastValueFrom(tgiService.getChatMessageContentsAsync(chatHistory, kernel))
  const message = reply.map((v) => v.content).join("")
  chatHistory.addAssistantMessage(message)
}

console.log("======== HuggingFace - TGI ========")

const main = async () => {
  const tgi = HuggingFaceTGI.Builder().withModelId("tgi").withClient(client).build()

  console.log("Chat content:")
  console.log("------------------------")

  const chatHistory = new ChatHistory("You are a librarian, expert about books")
  // First user message
  chatHistory.addUserMessage("Hi, I'm looking for book suggestions")
  messageOutput(chatHistory)

  await GPTReply(tgi, chatHistory)
  messageOutput(chatHistory)

  chatHistory.addUserMessage(
    "I love history and philosophy, I'd like to learn something new about Greece, any suggestion"
  )
  messageOutput(chatHistory)

  await GPTReply(tgi, chatHistory)
  messageOutput(chatHistory)
}

main()
```
