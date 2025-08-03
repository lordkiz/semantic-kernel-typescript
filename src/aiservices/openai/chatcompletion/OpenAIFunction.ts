import { InputVariable, KernelFunctionMetadata } from "@semantic-kernel-typescript/core/functions"
import { ToolCallBehavior } from "@semantic-kernel-typescript/core/orchestration"
import { FunctionDefinition } from "openai/resources"
import { AIServiceFunction } from "../../commons/AIServiceFunction"

export default class OpenAIFunction extends AIServiceFunction<FunctionDefinition> {
  static build(metadata: KernelFunctionMetadata<any>, pluginName: string): OpenAIFunction {
    const name = metadata.getName()
    const functionDefinition = OpenAIFunction.toFunctionDefinition(metadata, pluginName)
    return new OpenAIFunction(name, pluginName, functionDefinition)
  }

  static toFunctionDefinition(
    metadata: KernelFunctionMetadata<any>,
    pluginName: string
  ): FunctionDefinition {
    try {
      const parameters: Record<string, any> = {}
      const required: string[] = []

      const metaParameters = metadata.getParameters()

      if (metaParameters.length) {
        parameters.type = "object"
        parameters.properties = {}

        for (const parameter of metaParameters) {
          const { name, ...restMeta } = OpenAIFunction.getSchemaForFunctionParameter(parameter)
          parameters.properties[name] = restMeta

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

  static getSchemaForFunctionParameter(parameter: InputVariable): FunctionDefinition {
    return parameter.toJsonSchema() as FunctionDefinition
  }
}
