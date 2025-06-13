import CaseInsensitiveMap from "../ds/CaseInsensitiveMap";
import PromptExecutionSettings from "../orchestration/PromptExecutionSettings";
import KernelFunctionMetadata from "./KernelFunctionMetadata";

export default abstract class KernelFunction<T> {
  private metadata: KernelFunctionMetadata<unknown>;
  private executionSettings:
    | CaseInsensitiveMap<PromptExecutionSettings>
    | undefined;

  constructor(
    metadata: KernelFunctionMetadata<any>,
    executionSettings?:
      | Map<string, PromptExecutionSettings>
      | CaseInsensitiveMap<PromptExecutionSettings>
  ) {
    this.metadata = metadata;
    this.executionSettings = new CaseInsensitiveMap<PromptExecutionSettings>();

    if (executionSettings) {
      this.executionSettings.putAll(
        executionSettings as CaseInsensitiveMap<PromptExecutionSettings>
      );
    }
  }

  /**
   * Creates a {@link KernelFunction} instance for a method, specified via a {@link Method}
   * instance
   *
   * @param <T>    The return type of the method.
   * @param method The method to be represented via the created {@link KernelFunction}.
   * @param target The target object for the {@code method} if it represents an instance method.
   *               This should be {@code null} if and only if {@code method} is a static method.
   * @return The created {@link KernelFunction} wrapper for {@code method}.
   */
  static createFromMethod<T>(method: Function, target: object) {
    return KernelFunctionFromMethod.builder<T>()
      .withMethod(method)
      .withTarget(target);
  }

  /**
   * Creates a {@link KernelFunction} instance based on a given prompt
   *
   * @param prompt The prompt to be used for the created {@link KernelFunction}.
   * @param <T>    The return type of the method
   * @return The builder for creating a {@link KernelFunction} instance.
   */
  static createFromPrompt<T>(prompt: string): FromPromptBuilder<T> {
    return KernelFunctionFromPrompt.builder<T>().withTemplate(prompt);
  }

  /**
   * Builder for creating a {@link KernelFunction} instance for a given
   * {@link PromptTemplateConfig}.
   *
   * @param promptTemplateConfiguration The configuration for the prompt template.
   * @param <T>                         The return type of the method
   * @return The builder for creating a {@link KernelFunction} instance.
   */
  static createFromPrompt<T>(
    promptTemplateConfiguration: PromptTemplateConfig
  ): FromPromptBuilder<T> {
    return KernelFunctionFromPrompt.builder<T>().withPromptTemplateConfig(
      promptTemplateConfiguration
    );
  }

  /**
   * Get the plugin name of the function.
   * @return The name of the plugin that this function is within
   */
  public getPluginName() {
    return this.metadata.getPluginName();
  }

  /**
   * Get the name of the function.
   * @return The name of this function
   */
  public getName() {
    return this.metadata.getName();
  }

  /**
   * Get the description of the function.
   * @return A description of the function
   */
  public getDescription() {
    return this.metadata.getDescription();
  }

  /**
   * Get an unmodifiable map of the execution settings for the function.
   *
   * @return An unmodifiable map of the execution settings for the function
   */
  public getExecutionSettings() {
    return Object.seal(this.executionSettings);
  }

  /**
   * Get the metadata for the function.
   *
   * @return The metadata for the function
   */
  public getMetadata() {
    return this.metadata;
  }
}
