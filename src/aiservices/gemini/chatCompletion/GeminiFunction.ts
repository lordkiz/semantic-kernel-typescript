import { FunctionDeclaration } from "@google/genai"
import ToolCallBehavior from "@semantic-kernel-typescript/core/orchestration/ToolCallBehavior"
import InputVariable from "../../../core/functions/InputVariable"
import KernelFunctionMetadata from "../../../core/functions/KernelFunctionMetadata"
import { AIServiceFunction } from "../../commons/AIServiceFunction"

export default class GeminiFunction extends AIServiceFunction<FunctionDeclaration> {
  static build(metadata: KernelFunctionMetadata<any>, pluginName: string): GeminiFunction {
    const name = metadata.getName()
    const functionDeclaration = GeminiFunction.toFunctionDeclaration(metadata, pluginName)
    return new GeminiFunction(name, pluginName, functionDeclaration)
  }

  static toFunctionDeclaration(
    metadata: KernelFunctionMetadata<any>,
    pluginName: string
  ): FunctionDeclaration {
    try {
      const metaParameters = metadata.getParameters()

      let parameters: Record<string, any> | undefined = undefined
      const required: string[] = []

      if (metaParameters.length) {
        parameters = {}
        parameters.type = "object"
        parameters.properties = {}

        for (const parameter of metaParameters) {
          const { name, ...restMeta } = GeminiFunction.getSchemaForFunctionParameter(parameter)
          if (name) {
            parameters.properties[name] = restMeta
          }

          if (parameter.isRequired) {
            required.push(parameter.name)
          }
        }

        parameters.required = required
      }

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
}
