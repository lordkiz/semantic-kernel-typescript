import { JsonProperty } from "../decorators/JsonProperty"
import { JsonCreator } from "../implementations/JsonCreator"

/**
 * Metadata for an input variable of a {@link KernelFunction}.
 */
class InputVariable extends JsonCreator {
  @JsonProperty("name") private name: string
  @JsonProperty("type") private type: string
  @JsonProperty("description") private description: string | undefined
  @JsonProperty("default") private defaultValue: string | undefined
  @JsonProperty("is_required") private required: boolean
  @JsonProperty("enum") private enumValues: any[] | undefined
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
    this.name = name
    this.description = description
    this.defaultValue = defaultValue
    this.required = !!required

    if (!type) {
      type = "string"
    }

    this.type = type

    this.enumValues = enumValues ? Object.seal(enumValues) : enumValues

    this.inputVariables = inputVariables
  }

  /**
   * Creates a new instance of {@link InputVariable}.
   *
   * @param name         the name of the input variable
   * @param type         the type of the input variable
   * @param description  the description of the input variable
   * @param defaultValue the default value of the input variable
   * @param required     whether the input variable is required
   * @param enumValues the enum values of the input variable
   * @return a new instance of {@link InputVariable}
   */
  public static build(
    name: string,
    type?: string,
    description?: string,
    defaultValue?: string,
    required?: boolean,
    enumValues?: any[]
  ): InputVariable {
    return new InputVariable(name, type, description, defaultValue, required, enumValues)
  }

  /**
   * Gets the name of the input variable.
   *
   * @return the name of the input variable
   */
  public getName() {
    return this.name
  }

  /**
   * Gets the description of the input variable.
   *
   * @return the description of the input variable
   */
  public getDescription() {
    return this.description
  }

  /**
   * Gets the default value of the input variable.
   *
   * @return the default value of the input variable
   */
  public getDefaultValue() {
    return this.defaultValue
  }

  /**
   * Gets whether the input variable is required.
   *
   * @return whether the input variable is required
   */
  public isRequired() {
    return this.required
  }

  /**
   * Gets the type of the input variable.
   *
   * @return the type of the input variable
   */
  public getType() {
    return this.type
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
  public getEnumValues() {
    return this.enumValues
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
      type: this.getType(),
      name: this.getName(),
      description: this.getDescription(),
      properties: {},
      enum: this.getEnumValues(),
    }

    const required = []

    let i = 0
    const ivs = this.inputVariables ?? []
    const l = ivs.length

    while (i < l) {
      const variable = ivs[i]

      if (variable.isRequired()) {
        required.push(variable.getName())
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
