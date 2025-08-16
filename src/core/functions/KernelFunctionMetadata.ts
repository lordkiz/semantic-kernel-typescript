import { InputVariable } from "./InputVariable"

/**
 * Metadata about a kernel function.
 */
export class KernelFunctionMetadata {
  private name: string
  private pluginName: string
  private description: string
  private parameters: InputVariable[]

  constructor(pluginName: string, name: string, description: string, parameters: InputVariable[]) {
    this.description = description
    this.name = name
    this.parameters = parameters
    this.pluginName = pluginName
  }

  getPluginName() {
    return this.pluginName
  }

  getName() {
    return this.name
  }

  getDescription() {
    return this.description
  }

  getParameters() {
    return Object.seal(this.parameters)
  }
}
