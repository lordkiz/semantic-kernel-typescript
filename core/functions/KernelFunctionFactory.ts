import { KernelFunctionFromMethod } from "./KernelFunctionFromMethod"
import { FromPromptBuilder, KernelFunctionFromPrompt } from "./KernelFunctionFromPrompt"
import { PromptTemplateConfig } from "./prompttemplate/PromptTemplateConfig"

export class KernelFunctionFactory {
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
  static createFromMethod<T>(method: Function, target?: InstanceType<any>) {
    return KernelFunctionFromMethod.Builder<T>().withMethod(method).withTarget(target)
  }

  /**
   * Creates a {@link KernelFunction} instance based on a given prompt
   *
   * @param prompt The prompt to be used for the created {@link KernelFunction}.
   * @param <T>    The return type of the method
   * @return The builder for creating a {@link KernelFunction} instance.
   */
  static createFromPrompt<T>(prompt: string): FromPromptBuilder<T> {
    return KernelFunctionFromPrompt.Builder<T>().withTemplate(prompt)
  }

  /**
   * Builder for creating a {@link KernelFunction} instance for a given
   * {@link PromptTemplateConfig}.
   *
   * @param promptTemplateConfiguration The configuration for the prompt template.
   * @param <T>                         The return type of the method
   * @return The builder for creating a {@link KernelFunction} instance.
   */
  static createFromPromptTemplateConfig<T>(
    promptTemplateConfiguration: PromptTemplateConfig
  ): FromPromptBuilder<T> {
    return KernelFunctionFromPrompt.Builder<T>().withPromptTemplateConfig(
      promptTemplateConfiguration
    )
  }
}
