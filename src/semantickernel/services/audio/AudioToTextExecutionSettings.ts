/**
 * Represents audio to text execution settings.
 */
export default class AudioToTextExecutionSettings {
  private readonly deploymentName?: string
  private readonly filename?: string
  private readonly responseFormat: string
  private readonly language?: string
  private readonly prompt?: string
  private readonly temperature?: number

  /**
   * Creates an instance of audio to text execution settings.
   * @param deploymentName The deployment name.
   * @param filename The filename.
   * @param responseFormat The response format.
   * @param language The language.
   * @param prompt The prompt.
   * @param temperature The temperature.
   */
  constructor(
    deploymentName: string | undefined,
    filename: string | undefined,
    responseFormat: string,
    language: string | undefined,
    prompt: string | undefined,
    temperature: number | undefined
  ) {
    this.deploymentName = deploymentName
    this.filename = filename
    this.responseFormat = responseFormat
    this.language = language
    this.prompt = prompt
    this.temperature = temperature
  }

  /**
   * The deployment name to use for audio transcription.
   *
   * When making a request against Azure OpenAI, this should be the customizable name of the
   * "model deployment" (example: my-gpt4-deployment) and not the name of the model itself
   * (example: gpt-4).
   *
   * When using non-Azure OpenAI, this corresponds to "model" in the request options and should
   * use the appropriate name of the model (example: gpt-4).
   * @returns The deployment name or undefined if not set.
   */
  public getDeploymentName(): string | undefined {
    return this.deploymentName
  }

  /**
   * The optional filename or descriptive identifier to associate with the audio data.
   * @returns The filename or descriptive identifier or undefined if not set.
   */
  public getFilename(): string | undefined {
    return this.filename
  }

  /**
   * The requested format of the transcription response data, which will influence the content and
   * detail of the result.
   * @returns The response format.
   */
  public getResponseFormat(): string {
    return this.responseFormat
  }

  /**
   * The language of the audio data as two-letter ISO-639-1 language code (e.g. 'en' or 'es').
   * @returns The language of the audio data or undefined if not set.
   */
  public getLanguage(): string | undefined {
    return this.language
  }

  /**
   * An optional hint to guide the model's style or continue from a prior audio segment. The
   * written language of the prompt should match the primary spoken language of the audio data.
   * @returns The prompt or undefined if not set.
   */
  public getPrompt(): string | undefined {
    return this.prompt
  }

  /**
   * The randomness of the generated text. Select a value from 0.0 to 1.0. 0 is the default.
   * @returns The temperature or undefined if not set.
   */
  public getTemperature(): number | undefined {
    return this.temperature
  }

  /**
   * Creates a new builder.
   * @returns The builder.
   */
  public static Builder(): AudioToTextExecutionSettingsBuilder {
    return new AudioToTextExecutionSettingsBuilder()
  }
}

/**
 * Represents a builder for audio to text execution settings.
 */
export class AudioToTextExecutionSettingsBuilder {
  private deploymentName?: string
  private filename?: string
  private responseFormat?: string
  private language?: string
  private prompt?: string
  private temperature?: number

  /**
   * Sets the deployment name to use for audio transcription.
   * @param deploymentName The deployment name.
   * @returns The builder.
   */
  public withDeploymentName(deploymentName: string): this {
    this.deploymentName = deploymentName
    return this
  }

  /**
   * Sets the filename or descriptive identifier to associate with the audio data.
   * @param filename The filename or descriptive identifier.
   * @returns The builder.
   */
  public withFilename(filename: string): this {
    this.filename = filename
    return this
  }

  /**
   * The requested format of the transcription response data, which will influence the content
   * and detail of the result.
   * @param responseFormat The response format. Supported formats are json, text, srt,
   *                       verbose_json, or vtt. Default is 'json'.
   * @returns The builder.
   */
  public withResponseFormat(responseFormat: string): this {
    this.responseFormat = responseFormat
    return this
  }

  /**
   * The language of the audio data as two-letter ISO-639-1 language code (e.g. 'en' or 'es').
   * @param language The language of the audio data.
   * @returns The builder.
   */
  public withLanguage(language: string): this {
    this.language = language
    return this
  }

  /**
   * An optional hint to guide the model's style or continue from a prior audio segment. The
   * written language of the prompt should match the primary spoken language of the audio data.
   * @param prompt The prompt.
   * @returns The builder.
   */
  public withPrompt(prompt: string): this {
    this.prompt = prompt
    return this
  }

  /**
   * The randomness of the generated text. Select a value from 0.0 to 1.0. 0 is the default.
   * @param temperature The temperature.
   * @returns The builder.
   */
  public withTemperature(temperature: number): this {
    this.temperature = temperature
    return this
  }

  /**
   * Builds the audio to text execution settings.
   * @returns The audio to text execution settings.
   */
  public build(): AudioToTextExecutionSettings {
    if (!this.responseFormat) {
      this.responseFormat = "json"
    }

    return new AudioToTextExecutionSettings(
      this.deploymentName,
      this.filename,
      this.responseFormat,
      this.language,
      this.prompt,
      this.temperature
    )
  }
}
