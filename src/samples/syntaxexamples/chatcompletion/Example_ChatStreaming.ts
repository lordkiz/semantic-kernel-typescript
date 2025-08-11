import { Kernel } from "@semantic-kernel-typescript/core"
import { ChatHistory } from "@semantic-kernel-typescript/core/services"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"

// Configuration
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const kernel = Kernel.Builder().build()

const displayMessage = (chatHistory: ChatHistory) => {
  const message = chatHistory.getLastMessage()
  if (message) {
    console.log(`${message.AuthorRole}: ${message.content}`)
    console.log("------------------------")
  }
}

const handleStreamingResponse = async (
  chatGPT: OpenAIChatCompletion,
  chatHistory: ChatHistory,
  onComplete?: () => void
) => {
  let answer = ""

  try {
    const observable = chatGPT.getStreamingChatMessageContentsAsync(chatHistory, kernel)

    await new Promise<void>((resolve, reject) => {
      observable.subscribe({
        next: (value) => {
          answer += value.content
        },
        error: (err) => {
          console.error("Error during streaming:", err)
          reject(err)
        },
        complete: () => {
          chatHistory.addAssistantMessage(answer)
          displayMessage(chatHistory)
          resolve()
          if (onComplete) onComplete()
        },
      })
    })
  } catch (error) {
    console.error("Error in handleStreamingResponse:", error)
  }
}

const main = async () => {
  console.log("======== OpenAI - ChatGPT Streaming ========")
  console.log("Chat content:")
  console.log("------------------------")

  try {
    const chatGPT = OpenAIChatCompletion.Builder().withModelId(MODEL_ID).withClient(client).build()

    // Initialize chat with system message
    const chatHistory = new ChatHistory("You are a librarian, expert about books")

    // First exchange
    chatHistory.addUserMessage("Hi, I'm looking for book suggestions")
    displayMessage(chatHistory)

    await handleStreamingResponse(chatGPT, chatHistory)

    // Second exchange
    chatHistory.addUserMessage(
      "I love history and philosophy, I'd like to learn something new about Greece, any suggestions?"
    )
    displayMessage(chatHistory)

    await handleStreamingResponse(chatGPT, chatHistory)
  } catch (error) {
    console.error("Error in conversation:", error)
  }
}

main()
