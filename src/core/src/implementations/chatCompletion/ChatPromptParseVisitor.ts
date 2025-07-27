export interface ChatPromptParseVisitor<T> {
  addMessage(role?: string, content?: string, name?: string): ChatPromptParseVisitor<T>

  addFunction(
    name?: string,
    description?: string,
    parameters?: Record<string, unknown>
  ): ChatPromptParseVisitor<T>

  areMessagesEmpty(): boolean

  fromRawPrompt(rawPrompt: string): ChatPromptParseVisitor<T>

  get(): T

  reset(): ChatPromptParseVisitor<T>
}
