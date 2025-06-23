import FunctionResultMetadata from "../../orchestration/FunctionResultMetadata";
import { AuthorRole } from "./AuthorRole";
import ChatMessageContent from "./ChatMessageContent";
import ChatMessageTextContent from "./message/ChatMessageTextContent";

/**
 * Provides a history of messages between the User, Assistant and System
 */
export default class ChatHistory implements Iterable<ChatMessageContent<any>> {
  private chatMessageContents: ChatMessageContent<any>[];

  constructor();

  /**
   * Constructor that adds the given system instructions to the chat history.
   *
   * @param instructions The instructions to add to the chat history
   */
  constructor(instructions: string);
  /**
   * Constructor that adds the given chat message contents to the chat history.
   *
   * @param chatMessageContents The chat message contents to add to the chat history
   */
  constructor(chatMessageContents: ChatMessageContent<any>[]);

  constructor(
    instructionsOrChatMessageContents?: string | ChatMessageContent<any>[]
  ) {
    if (!instructionsOrChatMessageContents) {
      this.chatMessageContents = [];
    } else if (typeof instructionsOrChatMessageContents === "string") {
      const instructions = instructionsOrChatMessageContents;
      this.chatMessageContents = [];
      if (instructions.length) {
        this.chatMessageContents.push(
          ChatMessageTextContent.systemMessage(
            instructions
          ) as ChatMessageContent<string>
        );
      }
    } else if (Array.isArray(instructionsOrChatMessageContents)) {
      const chatMessageContents = Array.from(instructionsOrChatMessageContents);
      this.chatMessageContents = chatMessageContents;
    } else {
      throw new Error(
        "Invalid argument supplied for instructions or ChatMessageContent"
      );
    }
  }

  [Symbol.iterator](): Iterator<ChatMessageContent<any>, any, any> {
    return this.chatMessageContents[Symbol.iterator]();
  }

  /**
   * Get the chat history
   *
   * @return List of messages in the chat
   */
  getMessages() {
    return Object.seal(Array.from(this.chatMessageContents));
  }

  /**
   * Get last message
   *
   * @return The most recent message in chat
   */
  getLastMessage<T = string>() {
    if (!this.chatMessageContents.length) {
      return undefined;
    }

    return ChatMessageContent.clone<T>(
      this.chatMessageContents[this.chatMessageContents.length - 1]
    );
  }

  /**
   * Add all messages from the given chat history to this chat history
   *
   * @param value The chat history to add to this chat history
   */
  addAll(value: ChatHistory) {
    this.chatMessageContents = [
      ...this.chatMessageContents,
      ...value.getMessages(),
    ];
  }

  /**
   * Add a message to the chat history
   *
   * @param authorRole The role of the author of the message
   * @param content    The content of the message
   * @param encoding   The encoding of the message
   * @param metadata   The metadata of the message
   * @return {@code this} ChatHistory
   */
  addMessage(
    authorRole: AuthorRole,
    content: string,
    encoding?: BufferEncoding,
    metadata?: FunctionResultMetadata<any>
  ): ChatHistory {
    let builder = ChatMessageTextContent.Builder()
      .withAuthorRole(authorRole)
      .withContent(content);
    if (encoding) {
      builder = builder.withEncoding(encoding);
    }
    if (metadata) {
      builder = builder.withMetadata(metadata);
    }
    this.chatMessageContents.push(builder.build() as ChatMessageContent<any>);
    return this;
  }

  /**
   * Add a user message to the chat history
   *
   * @param content The content of the user message
   * @return {@code this} ChatHistory
   */
  addUserMessage(content: string): ChatHistory {
    return this.addMessage(AuthorRole.USER, content);
  }

  /**
   * Add an assistant message to the chat history
   *
   * @param content The content of the assistant message
   * @return {@code this} ChatHistory
   */
  addAssistantMessage(content: string): ChatHistory {
    return this.addMessage(AuthorRole.ASSISTANT, content);
  }

  /**
   * Add an system message to the chat history
   *
   * @param content The content of the system message
   * @return {@code this} ChatHistory
   */
  public addSystemMessage(content: string): ChatHistory {
    return this.addMessage(AuthorRole.SYSTEM, content);
  }

  /**
   * Clear the chat history
   */
  clear() {
    this.chatMessageContents = [];
  }
}
