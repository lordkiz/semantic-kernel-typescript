---
sidebar_position: 2
---

# Chat History

The chat history object is used to maintain a record of messages in a chat session. It is used to store messages from different authors, such as users, assistants, tools, or the system. As the primary mechanism for sending and receiving messages, the chat history object is essential for maintaining context and continuity in a conversation.

## Creating a chat history object

A chat history object is a list under the hood, making it easy to create and add messages to.

```ts
import { ChatHistory } from "@semantic-kernel-typescript/core/services"
// Create a chat history object
const chatHistory = new ChatHistory()

chatHistory.addSystemMessage("You are a helpful assistant.")
chatHistory.addUserMessage("What's available to order?")
chatHistory.addAssistantMessage(
  "We have pizza, pasta, and salad available to order. What would you like to order?"
)
chatHistory.addUserMessage("I'd like to have the first option, please.")
```

## Adding richer messages to a chat history

The easiest way to add messages to a chat history object is to use the methods above. However, you can also add messages manually by creating a new ChatMessage object. This allows you to provide additional information, like names and images content.

```ts
import { ChatHistory, ChatMessageImageContent } from "@semantic-kernel-typescript/core/services"
import fs from "fs"

fs.readFile(__dirname + "/oscar.jpg", async (err, image) => {
  if (err) throw err

  const chatHistory = new ChatHistory("You look at images and answer questions about them")

  chatHistory.addUserMessage(
    "This data string is an image of a animal in the park. The next message is the data string of the image. What animal is it?"
  )

  const imageContent = ChatMessageImageContent.Builder<string>().withImage("jpg", image).build()
  chatHistory.addMessage(imageContent)
})
```
