import { FunctionDeclaration } from "@google/genai"
import { authorRoleFromString } from "../../../core/services/chatcompletion/AuthorRole"
import ChatHistory from "../../../core/services/chatcompletion/ChatHistory"
import ChatMessageTextContent from "..../../../core/src/services/chatcompletion/AuthorRoleMessageTextContent"
import { ChatPromptParseV../../../core/src/services/chatcompletion/ChatHistorychatCompletion/ChatPromptParseVisitor"
import { ChatXMLPromptParser } from ../../../core/src/services/chatcompletion/message/ChatMessageTextContentr"

interface ParsedPrompt {
  chatHistory: ChatHistory
  functionDefinitions?: FunctionDeclaration[]
}

class GeminiChatPromptParseVisitor implements ChatPromptParseVisitor<ParsedPrompt> {
  private parsedRaw: ParsedPrompt | undefined
  private readonly functionDefinitions: FunctionDeclaration[] = []
  private readonly chatHistory: ChatHistory = new ChatHistory()

  public addMessage(role: string, content: string): ChatPromptParseVisitor<ParsedPrompt> {
    this.chatHistory.addMessage(authorRoleFromString(role), content)

    return this
  }

  public addFunction(
    name: string,
    description: string,
    parameters: Record<string, any>
  ): ChatPromptParseVisitor<ParsedPrompt> {
    const functionDef: FunctionDeclaration = { name }

    if (description !== null) {
      functionDef.description = description
    }

    if (parameters !== null) {
      functionDef.parameters = parameters
    }

    this.functionDefinitions.push(functionDef)

    return this
  }

  public areMessagesEmpty(): boolean {
    return this.chatHistory.getMessages().length === 0
  }

  public fromRawPrompt(rawPrompt: string): ChatPromptParseVisitor<ParsedPrompt> {
    const message = ChatMessageTextContent.userMessage(rawPrompt)

    this.parsedRaw = {
      chatHistory: new ChatHistory([message]),
    }

    return this
  }

  public get(): ParsedPrompt {
    if (this.parsedRaw !== undefined) {
      return this.parsedRaw
    }
    return {
      chatHistory: new ChatHistory(this.chatHistory.getMessages()),
      functionDefinitions:
        this.functionDefinitions.length > 0 ? Object.seal(this.functionDefinitions) : undefined,
    }
  }

  public reset(): ChatPromptParseVisitor<ParsedPrompt> {
    return new GeminiChatPromptParseVisitor()
  }
}

export class GeminiXMLPromptParser {
  public static parse(rawPrompt: string): ParsedPrompt {
    const visitor = ChatXMLPromptParser.parse(rawPrompt, new GeminiChatPromptParseVisitor())
    return visitor.get()
  }
}
