/**
 * Represents audio content.
 */
export default class AudioContent {
  private readonly _data: Buffer
  private readonly _modelId: string | undefined

  /**
   * Creates an instance of audio content.
   * @param data The audio data.
   * @param modelId The model ID.
   */
  constructor(data: Buffer, modelId?: string) {
    this._data = data
    this._modelId = modelId
  }

  /**
   * Gets the audio data.
   * @returns The audio data.
   */
  public get data(): Buffer {
    return this._data
  }

  /**
   * Gets the model ID.
   * @returns The model ID.
   */
  public get modelId() {
    return this._modelId
  }

  /**
   * Gets the inner content.
   * @returns The inner content.
   */
  public get innerContent() {
    return
  }

  /**
   * Gets the metadata.
   * @returns The metadata.
   */
  public get metadata(): Map<string, any> | undefined {
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
  private data: Buffer | undefined
  private modelId: string | undefined

  /**
   * Sets the audio data.
   * @param data The audio data.
   * @returns The builder.
   */
  public withData(data: Buffer): AudioContentBuilder {
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
