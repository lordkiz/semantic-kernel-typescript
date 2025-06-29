import { JsonProperty } from "../decorators/JsonProperty"
import { JsonCreator } from "../implementations/JsonCreator"

/**
 * Input parameter for semantic functions
 */

class InputParameter extends JsonCreator {
  @JsonProperty("name") private readonly name: string
  @JsonProperty("description") private readonly description: string
  @JsonProperty("defaultValue") private readonly defaultValue: string

  /**
   * Creates a new instance of the {@link InputParameter} class.
   *
   * @param name         name of the parameter
   * @param description  description of the parameter
   * @param defaultValue default value of the parameter
   */
  public constructor(name: string, description: string, defaultValue: string) {
    this.name = name
    this.description = description
    this.defaultValue = defaultValue
  }

  /**
   * Name of the parameter to pass to the function. e.g. when using "{{$input}}" the name is
   * "input", when using "{{$style}}" the name is "style", etc.
   *
   * @return name
   */
  public getName() {
    return this.name
  }

  /**
   * Parameter description for UI apps and planner. Localization is not supported here.
   *
   * @return description
   */
  public getDescription() {
    return this.description
  }

  /**
   * Default value when nothing is provided
   *
   * @return the default value
   */
  public getDefaultValue() {
    return this.defaultValue
  }
}

export default InputParameter
