import { JsonCreator } from "../decorators/JsonCreator";
import { JsonProperty } from "../decorators/JsonProperty";

/**
 * Metadata for an input variable of a {@link KernelFunction}.
 */
@JsonCreator()
class InputVariable {
  @JsonProperty("name") private readonly name: string;
  @JsonProperty("type") private readonly type: string;
  @JsonProperty("description") private readonly description: string | undefined;
  @JsonProperty("default") private readonly defaultValue: string | undefined;
  @JsonProperty("is_required") private readonly required: boolean;
  @JsonProperty("enum") private readonly enumValues: any[] | undefined;

  /**
   * Creates a new instance of {@link InputVariable}.
   *
   * @param name         the name of the input variable
   * @param type         the type of the input variable
   * @param description  the description of the input variable
   * @param defaultValue the default value of the input variable
   * @param isRequired   whether the input variable is required
   * @param enumValues   the enum values of the input variable
   */
  public constructor(
    name: string,
    type?: string,
    description?: string,
    defaultValue?: string,
    required?: boolean,
    enumValues?: any[]
  ) {
    this.name = name;
    this.description = description;
    this.defaultValue = defaultValue;
    this.required = !!required;

    if (!type) {
      type = "string";
    }

    this.type = type;

    if (!!enumValues) {
      this.enumValues = Object.seal(enumValues);
    } else {
      this.enumValues = enumValues;
    }
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
    return new InputVariable(
      name,
      type,
      description,
      defaultValue,
      required,
      enumValues
    );
  }

  /**
   * Gets the name of the input variable.
   *
   * @return the name of the input variable
   */
  public getName() {
    return this.name;
  }

  /**
   * Gets the description of the input variable.
   *
   * @return the description of the input variable
   */
  public getDescription() {
    return this.description;
  }

  /**
   * Gets the default value of the input variable.
   *
   * @return the default value of the input variable
   */
  public getDefaultValue() {
    return this.defaultValue;
  }

  /**
   * Gets whether the input variable is required.
   *
   * @return whether the input variable is required
   */
  public isRequired() {
    return this.isRequired;
  }

  /**
   * Gets the type of the input variable.
   *
   * @return the type of the input variable
   */
  public getType() {
    return this.type;
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
    return this.enumValues;
  }
}

export default InputVariable;
