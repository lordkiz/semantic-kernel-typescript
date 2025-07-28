import { FunctionDeclaration } from "@google/genai"
import { Logger } from "@semantic-kernel-typescript/core/log/Logger"
import ToolCallBehavior from "@semantic-kernel-typescript/core/orchestration/ToolCallBehavior"
import InputVariable from "../../../core/functions/InputVariable"
import KernelFunctionMetadata from "../../../core/functions/KernelFunctionMetadata"

export default class GeminiFunction {
  private _pluginName: string
  private _name: string
  private _functionDeclaration: FunctionDeclaration

  constructor(name: string, pluginName: string, functionDeclaration: FunctionDeclaration) {
    this._name = name
    this._pluginName = pluginName
    this._functionDeclaration = functionDeclaration
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

        if (parameter.isRequired) {
          required.push(parameter.name)
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

  get name() {
    return this._name
  }

  get pluginName() {
    return this._pluginName
  }

  get functionDeclaration() {
    return this._functionDeclaration
  }
}
