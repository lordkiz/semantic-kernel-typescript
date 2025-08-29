import { SKException } from "../exceptions/SKException"
import { HandlebarsPromptTemplate } from "../templateengine/handlebars/HandlebarsPromptTemplate"
import { HandlebarsPromptTemplateFactory } from "./HandlebarsPromptTemplateFactory"
import { PromptTemplate } from "./prompttemplate/PromptTemplate"
import { PromptTemplateConfig } from "./prompttemplate/PromptTemplateConfig"
import { PromptTemplateFactory } from "./prompttemplate/PromptTemplateFactory"

export class KernelPromptTemplateFactory extends PromptTemplateFactory {
  /**
   * Create a prompt template, if possible, from the given configuration. This is a convenience
   * method that wraps the {@link KernelPromptTemplateFactory#tryCreate(PromptTemplateConfig)}
   * method.
   *
   * @param templateConfig The configuration for the prompt template.
   * @return The prompt template.
   * @throws UnknownTemplateFormatException If the template format is not supported.
   * @see PromptTemplateConfig#getTemplateFormat()
   */
  static build(templateConfig: PromptTemplateConfig): PromptTemplate {
    return new KernelPromptTemplateFactory().tryCreate(templateConfig)
  }

  tryCreate(templateConfig: PromptTemplateConfig) {
    if (!templateConfig.getTemplate()) {
      throw new SKException(
        `No prompt template was provided for the prompt ${templateConfig.getName()}.`
      )
    }

    switch (templateConfig.getTemplateFormat().toLowerCase()) {
      // case PromptTemplateConfig.SEMANTIC_KERNEL_TEMPLATE_FORMAT:
      //   return DefaultPromptTemplate.build(templateConfig)
      case HandlebarsPromptTemplateFactory.HANDLEBARS_TEMPLATE_FORMAT:
        return new HandlebarsPromptTemplate(templateConfig)
      default:
        throw new PromptTemplateFactory.UnknownTemplateFormatException(
          templateConfig.getTemplateFormat()
        )
    }
  }
}
