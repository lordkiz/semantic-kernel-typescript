import { Kernel } from "@semantic-kernel-typescript/core"
import { ChatHistory, ChatMessageImageContent } from "@semantic-kernel-typescript/core/services"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import fs from "fs"
import OpenAI from "openai"
import { lastValueFrom } from "rxjs"

// Configuration
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1-mini"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const kernel = Kernel.Builder().build()

const messageOutput = (chatHistory: ChatHistory) => {
  const message = chatHistory.getLastMessage()
  console.log(message?.AuthorRole + ": " + message?.content.slice(0, 200))
  console.log("------------------------")
}

const describeImage = async (chatGPT: OpenAIChatCompletion) => {
  fs.readFile(__dirname + "/oscar.jpg", async (err, image) => {
    if (err) throw err

    const chatHistory = new ChatHistory("You look at images and answer questions about them")

    messageOutput(chatHistory)

    chatHistory.addUserMessage(
      "This data string is an image of a animal in the park. The next message is the data string of the image. What animal is it?"
    )

    messageOutput(chatHistory)

    const imageContent = ChatMessageImageContent.Builder<string>().withImage("jpg", image).build()
    chatHistory.addMessage(imageContent)

    messageOutput(chatHistory)

    const reply = await lastValueFrom(chatGPT.getChatMessageContentsAsync(chatHistory, kernel))

    const message = reply[0]
    console.log("\n------------------------")
    console.log(message.content)
  })
}

const describeUrl = async (chatGPT: OpenAIChatCompletion) => {
  const chatHistory = new ChatHistory("You look at images and describe them")

  // First user message
  chatHistory.addUserMessage("Describe the following image")
  messageOutput(chatHistory)

  chatHistory.addMessage(
    ChatMessageImageContent.Builder<string>()
      .withImageUrl("https://cr.openjdk.org/~jeff/Duke/jpg/Welcome.jpg")
      .build()
  )

  messageOutput(chatHistory)

  const reply = await lastValueFrom(chatGPT.getChatMessageContentsAsync(chatHistory, kernel))

  const message = reply[0]
  console.log("\n------------------------")
  console.log(message.content)
}

const main = async () => {
  console.log("======== OpenAI - ChatGPT Vision ========")

  const chatGPT = OpenAIChatCompletion.Builder().withModelId(MODEL_ID).withClient(client).build()

  await describeUrl(chatGPT)
  await describeImage(chatGPT)
}

main()
