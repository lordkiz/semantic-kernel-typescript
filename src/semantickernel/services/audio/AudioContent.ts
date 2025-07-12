/**
 * Represents audio content.
 */
export default class AudioContent {
  private readonly data: File
  private readonly modelId: string | undefined

  /**
   * Creates an instance of audio content.
   * @param data The audio data.
   * @param modelId The model ID.
   */
  constructor(data: File, modelId?: string) {
    this.data = data
    this.modelId = modelId
  }

  /**
   * Gets the audio data.
   * @returns The audio data.
   */
  public getData(): File {
    return this.data
  }

  /**
   * Gets the model ID.
   * @returns The model ID.
   */
  public getModelId() {
    return this.modelId
  }

  /**
   * Gets the inner content.
   * @returns The inner content.
   */
  public getInnerContent() {
    return
  }

  /**
   * Gets the metadata.
   * @returns The metadata.
   */
  public getMetadata(): Map<string, any> | undefined {
    return
  }

  /**
   * Creates a new builder.
   * @returns The builder.
   */
  public static Builder(): AudioContentBuilder {
    return new AudioContentBuilder()
  }
}

/**
 * Represents a builder for audio content.
 */
export class AudioContentBuilder {
  private data: File | undefined
  private modelId: string | undefined

  /**
   * Sets the audio data.
   * @param data The audio data.
   * @returns The builder.
   */
  public withData(data: File): AudioContentBuilder {
    this.data = data
    return this
  }

  /**
   * Sets the model ID.
   * @param modelId The model ID.
   * @returns The builder.
   */
  public withModelId(modelId: string): AudioContentBuilder {
    this.modelId = modelId
    return this
  }

  /**
   * Builds the audio content.
   * @returns The audio content.
   * @throws Error if data or modelId is not provided.
   */
  public build(): AudioContent {
    if (!this.data) {
      throw new Error("Data is required")
    }

    if (!this.modelId) {
      throw new Error("Model ID is required")
    }

    return new AudioContent(this.data, this.modelId)
  }
}
