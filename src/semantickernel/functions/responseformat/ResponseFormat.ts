/**
 * The type of the response format.
 */
enum ResponseFormat {
  /**
   * Only valid for openai chat completion, with GPT-4 and gpt-3.5-turbo-1106+ models.
   */
  "JSON_OBJECT" = "JSON_OBJECT",
  /**
   * Only valid for openai chat completion, with GPT-4 and gpt-3.5-turbo-1106+ models.
   */
  "JSON_SCHEMA" = "JSON_SCHEMA",
  /**
   * The response is in text format.
   */
  "TEXT" = "TEXT",
}

export default ResponseFormat;
