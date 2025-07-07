/**
 * Represents the content of a chat message
 */
export enum ChatMessageContentType {
  /**
   * The content is text
   */
  TEXT = "text",
  /**
   * The content is an image
   */
  IMAGE_URL = "image_url",

  /**
   * The content is an input_audio
   */
  INPUT_AUDIO = "input_audio",

  /**
   * The content is file
   */
  FILE = "file",
}
