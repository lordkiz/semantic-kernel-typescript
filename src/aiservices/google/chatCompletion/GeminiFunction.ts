import { FunctionDeclaration } from "@google/genai"
import InputVariable from "../../../semantickernel/functions/InputVariable"
import KernelFunctionMetadata from "../../../semantickernel/functions/KernelFunctionMetadata"
import { Logger } from "../../../semantickernel/log/Logger"
import ToolCallBehavior from "../../../semantickernel/orchestration/ToolCallBehavior"

export default class GeminiFunction {
  private pluginName: string
  private name: string
  private functionDeclaration: FunctionDeclaration

  constructor(name: string, pluginName: string, functionDeclaration: FunctionDeclaration) {
    this.name = name
    this.pluginName = pluginName
    this.functionDeclaration = functionDeclaration
  }

  static build(metadata: KernelFunctionMetadata<any>, pluginName: string): GeminiFunction {
    const name = metadata.getName()
    const functionDeclaration = GeminiFunction.toFunctionDeclaration(metadata, pluginName)
    return new GeminiFunction(name, pluginName, functionDeclaration)
  }

  static toFunctionDeclaration(
    metadata: KernelFunctionMetadata<any>,
    pluginName: string
  ): FunctionDeclaration {
    const parameters: Record<string, any> = {}
    const required: string[] = []

    const metaParameters = metadata.getParameters()

    if (metaParameters.length) {
      parameters.type = "object"
      parameters.properties = {}
    }
    try {
      for (const parameter of metaParameters) {
        const { name, ...restMeta } = GeminiFunction.getSchemaForFunctionParameter(parameter)
        if (!name) {
          Logger.warn(`unable to retrieve name missing from parameter ${parameter}`)
          continue
        }

        parameters.properties[name] = restMeta

        if (parameter.isRequired()) {
          required.push(parameter.getName())
        }
      }

      parameters.required = required

      return {
        name: ToolCallBehavior.formFullFunctionName(pluginName, metadata.getName()),
        description: metadata.getDescription(),
        parameters,
      }
    } catch (e) {
      throw new Error(`Error ${e}`)
    }
  }

  static getSchemaForFunctionParameter(parameter: InputVariable): FunctionDeclaration {
    return parameter.toJsonSchema() as FunctionDeclaration
  }

  getName() {
    return this.name
  }

  getPluginName() {
    return this.pluginName
  }

  getFunctionDeclaration() {
    return this.functionDeclaration
  }
}
