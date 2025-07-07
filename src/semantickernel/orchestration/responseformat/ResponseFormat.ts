/**
 * The type of the response format.
 */
enum ResponseFormat {
  /**
   * Only valid for openai chat completion, with GPT-4 and gpt-3.5-turbo-1106+ models.
   */
  "JSON_OBJECT" = "json_object",
  /**
   * Only valid for openai chat completion, with GPT-4 and gpt-3.5-turbo-1106+ models.
   */
  "JSON_SCHEMA" = "json_schema",
  /**
   * The response is in text format.
   */
  "TEXT" = "text",
}

export default ResponseFormat
