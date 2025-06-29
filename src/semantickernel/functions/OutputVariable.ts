import { JsonProperty } from "../decorators/JsonProperty"
import { JsonCreator } from "../implementations/JsonCreator"

/**
 * Metadata for an output variable of a kernel function.
 * @param <T> The type of the output variable.
 */
class OutputVariable<T> extends JsonCreator {
  @JsonProperty("description") private readonly description: string | undefined
  @JsonProperty({ name: "type", defaultValue: "string" })
  private readonly type: string | undefined
  /**
   * Constructor.
   *
   * @param type        The type of the output variable.
   * @param description The description of the output variable.
   */
  public constructor(type?: string, description?: string) {
    super()
    this.description = description

    this.type = type || "string"
  }

  /**
   * Get the description of the output variable.
   *
   * @return The description of the output variable.
   */
  public getDescription() {
    return this.description
  }

  /**
   * Get the type of the output variable.
   *
   * @return The type of the output variable.
   */
  // public Class<?> getType() {
  //     return KernelPluginFactory.getTypeForName(type);
  // }
}

export default OutputVariable
