/**
 * Represents the settings for text to audio execution.
 */
export default class TextToAudioExecutionSettings {
  private readonly voice: string
  private readonly responseFormat: string
  private readonly speed?: number
  private readonly fileName: string

  /**
   * Creates a new instance of the settings.
   * @param voice The voice.
   * @param responseFormat The response format.
   * @param speed The speed (optional).
   */
  constructor(voice: string, responseFormat: string, fileName: string, speed?: number) {
    this.voice = voice
    this.responseFormat = responseFormat
    this.fileName = fileName
    this.speed = speed
  }

  /**
   * Gets the voice.
   * @returns The voice.
   */
  public getVoice(): string {
    return this.voice
  }

  /**
   * Gets the response format.
   * @returns The response format.
   */
  public getResponseFormat(): string {
    return this.responseFormat
  }

  /**
   * Gets the speed.
   * @returns The speed or undefined if not set.
   */
  public getSpeed(): number | undefined {
    return this.speed
  }

  /**
   * Gets the fileName.
   * @returns The fileName.
   */
  public getFileName(): string {
    return this.fileName
  }

  /**
   * Creates a new builder.
   * @returns The builder.
   */
  public static Builder(): TextToAudioExecutionSettingsBuilder {
    return new TextToAudioExecutionSettingsBuilder()
  }
}

/**
 * Represents a builder for text to audio execution settings.
 */
export class TextToAudioExecutionSettingsBuilder {
  private voice?: string
  private responseFormat?: string
  private speed?: number
  private fileName?: string

  /**
   * Sets the voice to use for the audio generation.
   * @param voice The voice.
   * @returns The builder.
   */
  public withVoice(voice: string): this {
    this.voice = voice
    return this
  }

  /**
   * Sets the response format, e.g "mp3", "opus", "aac", "flac"
   * @param responseFormat The response format.
   * @returns The builder.
   */
  public withResponseFormat(responseFormat: string): this {
    this.responseFormat = responseFormat
    return this
  }

  withFileName(fileName: string) {
    this.fileName = fileName
    return this
  }

  /**
   * Sets the speed of the audio generation.
   * @param speed The speed.
   * @returns The builder.
   */
  public withSpeed(speed: number): this {
    this.speed = speed
    return this
  }

  /**
   * Builds the settings.
   * @returns The settings.
   * @throws Error if voice or response format is not provided.
   */
  public build(): TextToAudioExecutionSettings {
    if (!this.voice) {
      throw new Error("Voice must be set")
    }
    if (!this.responseFormat) {
      throw new Error("Response format must be set")
    }

    if (!this.fileName) {
      throw new Error("FileName must be set")
    }
    return new TextToAudioExecutionSettings(
      this.voice,
      this.responseFormat,
      this.fileName,
      this.speed
    )
  }
}
