import { ChatPromptParseVisitor } from "@semantic-kernel-typescript/core/implementations/chatCompletion/ChatPromptParseVisitor"
import { ChatXMLPromptParser } from "@semantic-kernel-typescript/core/implementations/chatCompletion/ChatXMLPromptParser"
import he from "he"
import { ChatCompletionMessageParam, FunctionDefinition } from "openai/resources"
import { v4 as uuidv4 } from "uuid"

interface ParsedPrompt {
  messages: ChatCompletionMessageParam[]
  functionDefinitions: FunctionDefinition[] | null
}

class OpenAIChatPromptParseVisitor implements ChatPromptParseVisitor<ParsedPrompt> {
  private parsedRaw: ParsedPrompt | null = null
  private readonly functionDefinitions: FunctionDefinition[] = []
  private readonly messages: ChatCompletionMessageParam[] = []

  public addMessage(
    role: ChatCompletionMessageParam["role"],
    content: string,
    name?: string
  ): ChatPromptParseVisitor<ParsedPrompt> {
    this.messages.push({
      role,
      content,
      name: name ?? uuidv4(),
    } as ChatCompletionMessageParam)
    return this
  }

  public addFunction(
    name: string,
    description: string,
    parameters: Record<string, any>
  ): ChatPromptParseVisitor<ParsedPrompt> {
    const functionDef: FunctionDefinition = { name }

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
    return this.messages.length === 0
  }

  public fromRawPrompt(rawPrompt: string): ChatPromptParseVisitor<ParsedPrompt> {
    const message: ChatCompletionMessageParam = {
      name: uuidv4(),
      content: rawPrompt,
      role: "user",
    }

    this.parsedRaw = {
      messages: [message],
      functionDefinitions: null,
    }

    return this
  }

  public get(): ParsedPrompt {
    if (this.parsedRaw !== null) {
      return this.parsedRaw
    }
    return {
      messages: this.messages,
      functionDefinitions: this.functionDefinitions.length > 0 ? this.functionDefinitions : null,
    }
  }

  public reset(): ChatPromptParseVisitor<ParsedPrompt> {
    return new OpenAIChatPromptParseVisitor()
  }
}

export class OpenAIXMLPromptParser {
  public static parse(rawPrompt: string): ParsedPrompt {
    const visitor = ChatXMLPromptParser.parse(rawPrompt, new OpenAIChatPromptParseVisitor())
    return visitor.get()
  }

  public static unescapeRequest(message: ChatCompletionMessageParam): ChatCompletionMessageParam {
    const content =
      typeof message.content === "string"
        ? he.decode(message.content)
        : JSON.stringify(message.content)
    return { ...message, content } as ChatCompletionMessageParam
  }
}
