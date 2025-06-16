import PromptExecutionSettings from "../orchestration/PromptExecutionSettings";
import { AIService } from "./types/AIService";

/**
 * The result of an AI service selection.
 *
 * @param <T> The type of AI service.
 */
export default class AIServiceSelection<T extends AIService> {
  private service: T;
  private settings: PromptExecutionSettings | undefined;

  /**
   * Creates a new AI service selection.
   *
   * @param service  The selected AI service.
   * @param settings The settings associated with the selected service. This may be {@code null}
   *                 even if a service is selected..
   */
  constructor(service: T, settings?: PromptExecutionSettings) {
    this.service = service;
    this.settings = settings;
  }

  /**
   * Gets the selected AI service.
   *
   * @return The selected AI service.
   */
  getService(): T {
    return this.service;
  }

  /**
   * Gets the settings associated with the selected service.
   *
   * @return The settings associated with the selected service. This may be {@code null} even if a
   * service is selected.
   */
  getSettings(): PromptExecutionSettings | undefined {
    return this.settings;
  }
}
