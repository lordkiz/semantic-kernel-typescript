import { PromptTemplate } from "./PromptTemplate"
import { PromptTemplateConfig } from "./PromptTemplateConfig"

class UnknownTemplateFormatException extends Error {
  /**
   * Constructor.
   *
   * @param templateFormat The template format that is not supported.
   */
  constructor(templateFormat: string) {
    super("Unknown template format: " + templateFormat)
  }
}

export abstract class PromptTemplateFactory {
  /**
   * Create a prompt template, if possible, from the given configuration. If the
   * {@code PromptTemplateConfig} is not supported, the method should throw an
   * {@code UnknownTemplateFormatException}.
   *
   * @param templateConfig The configuration for the prompt template.
   * @return The prompt template.
   * @throws UnknownTemplateFormatException If the template format is not supported.
   * @see PromptTemplateConfig#getTemplateFormat()
   */
  abstract tryCreate(templateConfig: PromptTemplateConfig): PromptTemplate

  /**
   * Exception thrown when the template format is not supported.
   *
   * @see PromptTemplateConfig#getTemplateFormat()
   */
  static UnknownTemplateFormatException = UnknownTemplateFormatException
}
