import InputVariable from "./InputVariable";
import OutputVariable from "./OutputVariable";

/**
 * Metadata about a kernel function.
 *
 * @param <T> The type of the return value of the function.
 */
export default class KernelFunctionMetadata<T> {
  private name: string;
  private pluginName: string;
  private description: string;
  private parameters: InputVariable[];
  private returnParameterType: OutputVariable<T>;

  constructor(
    pluginName: string,
    name: string,
    description: string,
    parameters: InputVariable[],
    returnParameterType: OutputVariable<T>
  ) {
    this.description = description;
    this.name = name;
    this.parameters = parameters;
    this.pluginName = pluginName;
    this.returnParameterType = returnParameterType;
  }

  getPluginName() {
    return this.pluginName;
  }

  getName() {
    return this.name;
  }

  getDescription() {
    return this.description;
  }

  getParameters() {
    return Object.seal(this.parameters);
  }

  getOutputVariableType() {
    return this.returnParameterType;
  }
}
