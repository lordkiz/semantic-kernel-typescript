import HandlebarsPromptTemplate from "../templateengine/handlebars/HandlebarsPromptTemplate"
import { PromptTemplate } from "./prompttemplate/PromptTemplate"
import PromptTemplateConfig from "./prompttemplate/PromptTemplateConfig"
import { PromptTemplateFactory } from "./prompttemplate/PromptTemplateFactory"

/**
 * A factory for creating a {@link HandlebarsPromptTemplate} instance for a
 * {@code PromptTemplateConfig} that uses the handlebars template format.
 */
export default class HandlebarsPromptTemplateFactory implements PromptTemplateFactory {
  /**
   * The handlebars template format.
   */
  static HANDLEBARS_TEMPLATE_FORMAT = "handlebars"

  tryCreate(templateConfig: PromptTemplateConfig): PromptTemplate {
    if (
      templateConfig.getTemplateFormat() &&
      HandlebarsPromptTemplateFactory.HANDLEBARS_TEMPLATE_FORMAT ===
        templateConfig.getTemplateFormat().toLowerCase()
    ) {
      return new HandlebarsPromptTemplate(templateConfig)
    }

    throw new PromptTemplateFactory.UnknownTemplateFormatException(
      templateConfig.getTemplateFormat()
    )
  }
}
