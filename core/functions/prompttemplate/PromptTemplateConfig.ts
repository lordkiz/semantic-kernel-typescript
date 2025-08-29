import { JsonProperty } from "../../decorators/JsonProperty"
import { SKException } from "../../exceptions/SKException"
import { JsonCreator } from "../../implementations/JsonCreator"
import { PromptExecutionSettings } from "../../orchestration/PromptExecutionSettings"
import { HandlebarsPromptTemplateFactory } from "../HandlebarsPromptTemplateFactory"
import { InputVariable } from "../InputVariable"
import { PromptTemplateOption } from "./PromptTemplateOption"

export type PromptTemplateConfigurationType = {
  schema?: number
  name?: string
  template?: string
  templateFormat?: string
  promptTemplateOptions?: Set<PromptTemplateOption>
  description?: string
  inputVariables?: InputVariable[]
  executionSettings?: PromptExecutionSettings
}

export class PromptTemplateConfig extends JsonCreator {
  /**
   * The current prompt template config schema version.
   */
  static readonly CURRENT_SCHEMA = 1

  /**
   * The default name for a prompt template config.
   */
  static readonly DEFAULT_CONFIG_NAME = "default"

  /**
   * The default template format for a prompt template config.
   */
  // static readonly SEMANTIC_KERNEL_TEMPLATE_FORMAT = "semantic-kernel";

  @JsonProperty("schema") private schema: number

  @JsonProperty("name") private name: string | undefined

  @JsonProperty("template") private template: string | undefined

  @JsonProperty({
    name: "template_format",
    // defaultValue: HandlebarsPromptTemplateFactory.HANDLEBARS_TEMPLATE_FORMAT,
  })
  private templateFormat: string

  @JsonProperty("prompt_template_options")
  private promptTemplateOptions: Set<PromptTemplateOption>

  @JsonProperty("description") private description: string | undefined

  @JsonProperty("input_variables")
  private inputVariables: InputVariable[]

  @JsonProperty("execution_settings") private executionSettings: PromptExecutionSettings

  constructor({
    schema,
    name,
    template,
    templateFormat,
    promptTemplateOptions,
    description,
    inputVariables,
    executionSettings,
  }: PromptTemplateConfigurationType) {
    super()
    this.schema = schema ?? PromptTemplateConfig.CURRENT_SCHEMA
    this.name = name
    this.template = template
    this.templateFormat =
      templateFormat ?? HandlebarsPromptTemplateFactory.HANDLEBARS_TEMPLATE_FORMAT

    this.promptTemplateOptions = promptTemplateOptions ?? new Set()
    this.description = description
    this.inputVariables = inputVariables ?? []
    this.executionSettings = executionSettings ?? PromptExecutionSettings.Builder<any>().build()
  }

  static fromPromptTemplateConfig(promptTemplate: PromptTemplateConfig) {
    return new PromptTemplateConfig({
      schema: promptTemplate.schema,
      name: promptTemplate.name,
      template: promptTemplate.template,
      templateFormat: promptTemplate.templateFormat,
      promptTemplateOptions: promptTemplate.promptTemplateOptions,
      description: promptTemplate.description,
      inputVariables: promptTemplate.inputVariables,
      executionSettings: promptTemplate.executionSettings,
    })
  }

  /**
   * Deserialize the JSON string to a PromptTemplateConfig.
   *
   * @param json The JSON string to parse
   * @return The PromptTemplateConfig object
   * @throws SKException If the prompt template config cannot be deserialized.
   */
  static parseFromJson(json: string): PromptTemplateConfig {
    try {
      const res = JSON.parse(json)
      return new PromptTemplateConfig({
        schema: res.schema,
        name: res.name,
        template: res.template,
        templateFormat: res.template_format,
        promptTemplateOptions: res.prompt_template_options,
        description: res.description,
        inputVariables: res.input_variables,
        executionSettings: res.execution_settings,
      })
    } catch (e) {
      throw new SKException(`Unable to parse prompt template config ${e}`)
    }
  }

  /**
   * Create a builder for a prompt template config.
   *
   * @return The prompt template config builder.
   */
  static Builder(): Builder {
    return new Builder()
  }

  getSchema() {
    return this.schema
  }

  getName() {
    return this.name
  }

  getTemplate() {
    return this.template
  }

  getTemplateFormat() {
    return this.templateFormat
  }

  getPromptTemplateOptions() {
    return Object.seal(this.promptTemplateOptions)
  }

  getDescription() {
    return this.description
  }

  getInputVariables() {
    return Object.seal(this.inputVariables)
  }

  getExecutionSettings() {
    return Object.seal(this.executionSettings)
  }

  copy(): Builder {
    return new Builder(this)
  }
}

class Builder {
  private schema: number
  private name: string | undefined
  private template: string | undefined

  private templateFormat: string

  private promptTemplateOptions: Set<PromptTemplateOption>
  private description: string | undefined

  private inputVariables: InputVariable[]

  private executionSettings: PromptExecutionSettings | undefined

  constructor()
  constructor(promptTemplateConfig: PromptTemplateConfig)
  constructor(promptTemplateConfig?: PromptTemplateConfig) {
    this.schema = promptTemplateConfig?.getSchema() ?? PromptTemplateConfig.CURRENT_SCHEMA

    this.name = promptTemplateConfig?.getName()

    this.template = promptTemplateConfig?.getTemplate()

    this.templateFormat =
      promptTemplateConfig?.getTemplateFormat() ??
      HandlebarsPromptTemplateFactory.HANDLEBARS_TEMPLATE_FORMAT

    this.promptTemplateOptions = promptTemplateConfig?.getPromptTemplateOptions() ?? new Set()

    this.description = promptTemplateConfig?.getDescription()

    this.inputVariables = Array.from(promptTemplateConfig?.getInputVariables() ?? [])

    this.executionSettings = promptTemplateConfig?.getExecutionSettings()
  }

  /**
   * Set the name of the prompt template config.
   *
   * @param name The name of the prompt template config.
   * @return {@code this} builder
   */
  withName(name: string) {
    this.name = name
    return this
  }

  /**
   * Add an input variable to the prompt template config.
   *
   * @param inputVariable The input variable to add.
   * @return {@code this} builder
   */
  addInputVariable(inputVariable: InputVariable) {
    this.inputVariables.push(inputVariable)
    return this
  }

  /**
   * Set the template of the prompt template config.
   *
   * @param template The template of the prompt template config.
   * @return {@code this} builder
   */
  withTemplate(template: string) {
    this.template = template
    return this
  }

  /**
   * Set the description of the prompt template config.
   *
   * @param description The description of the prompt template config.
   * @return {@code this} builder
   */
  withDescription(description: string) {
    this.description = description
    return this
  }

  /**
   * Set the template format of the prompt template config.
   *
   * @param templateFormat The template format of the prompt template config.
   * @return {@code this} builder
   */
  withTemplateFormat(templateFormat: string) {
    this.templateFormat = templateFormat
    return this
  }

  /**
   * Set the prompt template options.
   * @param option The prompt template option to add.
   * @return {@code this} builder.
   */
  addPromptTemplateOption(option: PromptTemplateOption) {
    this.promptTemplateOptions.add(option)
    return this
  }

  /**
   * Set the inputVariables of the prompt template config.
   *
   * @param inputVariables The input variables of the prompt template config.
   * @return {@code this} builder
   */
  withInputVariables(inputVariables: InputVariable[]) {
    this.inputVariables = Array.from(inputVariables)
    return this
  }

  /**
   * Set the prompt execution settings of the prompt template config.
   *
   * @param executionSettings The prompt execution settings of the prompt template config.
   * @return {@code this} builder
   */
  withExecutionSettings(executionSettings: PromptExecutionSettings) {
    this.executionSettings = executionSettings
    return this
  }

  /**
   * Build the prompt template config.
   *
   * @return The prompt template config.
   */
  public build(): PromptTemplateConfig {
    return new PromptTemplateConfig({
      schema: this.schema,
      name: this.name,
      template: this.template,
      templateFormat: this.templateFormat,
      promptTemplateOptions: this.promptTemplateOptions,
      description: this.description,
      inputVariables: this.inputVariables,
      executionSettings: this.executionSettings,
    })
  }
}
