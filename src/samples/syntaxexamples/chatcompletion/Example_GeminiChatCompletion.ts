import { GoogleGenAI } from "@google/genai"
import { Kernel } from "@semantic-kernel-typescript/core"
import { ChatCompletionService, ChatHistory } from "@semantic-kernel-typescript/core/services"
import { GeminiChatCompletion } from "@semantic-kernel-typescript/gemini/chatCompletion"
import { lastValueFrom } from "rxjs"
//

const kernel = Kernel.Builder().build()

const messageOutput = (chatHistory: ChatHistory) => {
  const message = chatHistory.getLastMessage()
  console.log(message?.getAuthorRole() + ": " + message?.getContent())
  console.log("------------------------")
}

const reply = async (geminiChat: ChatCompletionService, chatHistory: ChatHistory) => {
  const replyyy = await lastValueFrom(geminiChat.getChatMessageContentsAsync(chatHistory, kernel))

  const message: string[] = []

  replyyy.forEach((chatMessageContent) => {
    message.push(chatMessageContent.getContent())
  })

  chatHistory.addAssistantMessage(message.join(""))
}

const main = async () => {
  const client = new GoogleGenAI({
    apiKey: "AI....",
  })

  const geminiChat = GeminiChatCompletion.Builder()
    .withClient(client)
    .withModelId("gemini-2.5-flash")
    .build()

  console.log("Chat Content: ")
  console.log("________-------------__________ ")

  const chatHistory = new ChatHistory()

  chatHistory.addUserMessage("Hi, I'm looking for book suggestions")
  messageOutput(chatHistory)

  await reply(geminiChat, chatHistory)
  messageOutput(chatHistory)

  chatHistory.addUserMessage(
    "I love history and philosophy, I'd like to learn something new about Greece, any suggestion"
  )
  messageOutput(chatHistory)

  await reply(geminiChat, chatHistory)
  messageOutput(chatHistory)
}

main()
