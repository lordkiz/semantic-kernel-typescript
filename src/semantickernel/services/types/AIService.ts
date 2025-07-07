export abstract class AIService {
  /**
   * Gets the model identifier.
   *
   * @return The model identifier if it was specified in the service's attributes; otherwise,
   * {@code null}.
   */
  abstract getModelId(): string

  /**
   * Gets the service identifier.
   *
   * @return The service identifier.
   */
  abstract getServiceId(): string | undefined
}
