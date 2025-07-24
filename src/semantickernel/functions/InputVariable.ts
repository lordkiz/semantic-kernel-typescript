import SemanticKernelBuilder from "../builders/SemanticKernelBuilder"
import { JsonProperty } from "../decorators/JsonProperty"
import SKException from "../exceptions/SKException"
import { JsonCreator } from "../implementations/JsonCreator"
import { KernelFunctionParameterMetadata } from "./decorators/KernelFunctionParameter"

/**
 * Metadata for an input variable of a {@link KernelFunction}.
 */
class InputVariable extends JsonCreator {
  @JsonProperty("name") private _name: string
  @JsonProperty("type") private _type: string
  @JsonProperty("description") private _description: string | undefined
  @JsonProperty("default") private _defaultValue: string | undefined
  @JsonProperty("is_required") private required: boolean
  @JsonProperty("enum") private _enumValues: any[] | undefined
  private inputVariables: InputVariable[] | undefined

  /**
   * Creates a new instance of {@link InputVariable}.
   *
   * @param name         the name of the input variable
   * @param type         the type of the input variable
   * @param description  the description of the input variable
   * @param defaultValue the default value of the input variable
   * @param isRequired   whether the input variable is required
   * @param enumValues   the enum values of the input variable
   * @param inputVariables  nested input variables
   */
  public constructor(
    name: string,
    type?: string,
    description?: string,
    defaultValue?: string,
    required?: boolean,
    enumValues?: any[],
    inputVariables?: InputVariable[]
  ) {
    super()
    this._name = name
    this._description = description
    this._defaultValue = defaultValue
    this.required = !!required

    if (!type) {
      type = "string"
    }

    this._type = type

    this._enumValues = enumValues ? Object.seal(enumValues) : enumValues

    this.inputVariables = inputVariables
  }

  static Builder() {
    return new InputVariableBuilder()
  }

  static fromKernelFunctionParameterMetadata(
    kernelFunctionParameterMetadata: KernelFunctionParameterMetadata
  ): InputVariable {
    const { name, defaultValue, description, enumValues, required, type } =
      kernelFunctionParameterMetadata

    return InputVariable.Builder()
      .withName(name)
      .withDefaultValue(defaultValue)
      .withDescription(description ?? "")
      .withEnumValues(enumValues)
      .isRequired(!!required)
      .withType(type ?? "string")
      .build()
  }

  /**
   * Gets the name of the input variable.
   *
   * @return the name of the input variable
   */
  get name() {
    return this._name
  }

  /**
   * Gets the description of the input variable.
   *
   * @return the description of the input variable
   */
  get description() {
    return this._description
  }

  /**
   * Gets the default value of the input variable.
   *
   * @return the default value of the input variable
   */
  get defaultValue() {
    return this._defaultValue
  }

  /**
   * Gets whether the input variable is required.
   *
   * @return whether the input variable is required
   */
  get isRequired() {
    return this.required
  }

  /**
   * Gets the type of the input variable.
   *
   * @return the type of the input variable
   */
  get type() {
    return this._type
  }

  /**
   * Gets the class of the type of the input variable.
   *
   * @return the class of the type of the input variable
   */
  // public getTypeClass() {
  //     return KernelPluginFactory.getTypeForName(type);
  // }

  /**
   * Gets the possible enum values of the input variable.
   *
   * @return the possible enum values of the input variable
   */
  get enumValues() {
    return this._enumValues
  }

  addInputVariable(inputVariable: InputVariable) {
    this.inputVariables = [...(this.inputVariables ?? []), inputVariable]
    return this
  }

  toJsonSchema() {
    const jSchema = this._toJsonSchema({})

    return jSchema
  }

  private _toJsonSchema(initial: Record<string, any>): Record<string, any> {
    const res: Record<string, any> = {
      ...initial,
      type: this.type,
      name: this.name,
      description: this.description,
      properties: {},
      enum: this.enumValues,
    }

    const required = []

    let i = 0
    const ivs = this.inputVariables ?? []
    const l = ivs.length

    while (i < l) {
      const variable = ivs[i]

      if (variable.isRequired) {
        required.push(variable.name)
      }

      const schema = variable._toJsonSchema(res)
      const { name, ...restOfSchema } = schema

      res.properties[name] = restOfSchema
      i++
    }

    if (required.length) {
      res.required = required
    }

    const { properties, ...restRes } = res

    if (Object.keys(properties).length === 0) {
      return restRes
    }

    return res
  }
}

export default InputVariable

class InputVariableBuilder implements SemanticKernelBuilder<InputVariable> {
  private _name: string | undefined
  private _type: string | undefined
  private _description: string | undefined
  private _defaultValue: any | undefined
  private _isRequired: boolean | undefined
  private _enumValues: any[] | undefined
  private _inputVariables: InputVariable[] | undefined

  withName(name: string) {
    this._name = name
    return this
  }

  withType(typeName: string) {
    this._type = typeName
    return this
  }

  withDescription(description: string) {
    this._description = description
    return this
  }

  withDefaultValue(value: any) {
    this._defaultValue = value
    return this
  }

  isRequired(bool: boolean) {
    this._isRequired = bool
    return this
  }

  withEnumValues(values: any[] | undefined) {
    this._enumValues = values
    return this
  }

  addInputVariable(variable: InputVariable) {
    if (!this._inputVariables) {
      this._inputVariables = []
    }

    this._inputVariables.push(variable)

    return this
  }

  withInputVariables(variables: InputVariable[]) {
    this._inputVariables = [...(this._inputVariables ?? []), ...variables]

    return this
  }

  build(): InputVariable {
    if (!this._name) {
      throw new SKException("InputVariable must have a name")
    }

    return new InputVariable(
      this._name,
      this._type ?? "string",
      this._description,
      this._defaultValue,
      this._isRequired,
      this._enumValues,
      this._inputVariables
    )
  }
}
