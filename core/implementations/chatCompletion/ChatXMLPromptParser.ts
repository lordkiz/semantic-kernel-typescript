import { XMLParser } from "fast-xml-parser"
import { SKException } from "../../exceptions/SKException"
import { Logger } from "../../log/Logger"
import { ToolCallBehavior } from "../../orchestration/ToolCallBehavior"
import { ChatPromptParseVisitor } from "./ChatPromptParseVisitor"

interface FunctionDefinition {
  /**
   * The name of the function to be called. Must be a-z, A-Z, 0-9, or contain
   * underscores and dashes, with a maximum length of 64.
   */
  name: string

  /**
   * A description of what the function does, used by the model to choose when and
   * how to call the function.
   */
  description?: string

  /**
   * The parameters the functions accepts, described as a JSON Schema object. See the
   * [guide](https://platform.openai.com/docs/guides/function-calling) for examples,
   * and the
   * [JSON Schema reference](https://json-schema.org/understanding-json-schema/) for
   * documentation about the format.
   *
   * Omitting `parameters` defines a function with an empty parameter list.
   */
  parameters?: Record<string, any>

  /**
   * Whether to enable strict schema adherence when generating the function call. If
   * set to true, the model will follow the exact schema defined in the `parameters`
   * field. Only a subset of JSON Schema is supported when `strict` is `true`. Learn
   * more about Structured Outputs in the
   * [function calling guide](docs/guides/function-calling).
   */
  strict?: boolean | null
}

const xmlParserOptions = {
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  removeNSPrefix: false,
  attributeNamePrefix: "",
}

export class ChatXMLPromptParser {
  private static readonly LOGGER = Logger

  public static parse<T>(
    rawPrompt: string,
    chatPromptParseVisitor: ChatPromptParseVisitor<T>
  ): ChatPromptParseVisitor<T> {
    const prompts: string[] = [rawPrompt, `<prompt>${rawPrompt}</prompt>`]

    let parsedVisitor = chatPromptParseVisitor

    for (const prompt of prompts) {
      try {
        parsedVisitor = this.getChatRequestMessages(prompt, chatPromptParseVisitor)
        parsedVisitor = this.getFunctionDefinitions(prompt, chatPromptParseVisitor)

        if (!parsedVisitor.areMessagesEmpty()) {
          return parsedVisitor
        }
      } catch {
        // ignore
        parsedVisitor = parsedVisitor.reset()
      }
    }

    return parsedVisitor.fromRawPrompt(rawPrompt)
  }

  private static getChatRequestMessages<T>(
    prompt: string,
    chatPromptParseVisitor: ChatPromptParseVisitor<T>
  ): ChatPromptParseVisitor<T> {
    try {
      const parser = new XMLParser(xmlParserOptions)
      const xmlDoc = parser.parse(prompt, false)
      let messages = xmlDoc.message

      if (!messages) {
        messages = []
      } else if (typeof messages === "object" && messages.role) {
        messages = [messages]
      } // else messages is an array

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        const { role, content, name } = message
        chatPromptParseVisitor = chatPromptParseVisitor.addMessage(
          role,
          content ?? message["#text"],
          name
        )
      }
    } catch (e) {
      throw new SKException(`Failed to parse messages: ${e}`)
    }
    return chatPromptParseVisitor
  }

  private static getFunctionDefinitions<T>(
    prompt: string,
    chatPromptParseVisitor: ChatPromptParseVisitor<T>
  ): ChatPromptParseVisitor<T> {
    try {
      const parser = new XMLParser(xmlParserOptions)
      const xmlDoc = parser.parse(prompt, false)
      const functions = Object.keys(xmlDoc)
        .filter((key) => key === "function")
        .map((k) => xmlDoc[k])

      for (let i = 0; i < functions.length; i++) {
        const func = functions[i]
        const pluginName = func.pluginName || ""
        const name = func.name || ""
        const description = func.description || ""

        const fullName = ToolCallBehavior.formFullFunctionName(pluginName, name)
        const functionDefinition: FunctionDefinition = { name: fullName, description }

        let parameters: Record<string, any> = {}
        const requiredParameters: string[] = []
        let paramElements = func.parameter

        if (!paramElements) {
          paramElements = []
        } else if (typeof paramElements === "object" && paramElements.name) {
          paramElements = [paramElements]
        } // else paramElements is an array

        for (let j = 0; j < paramElements.length; j++) {
          const param = paramElements[j]
          const { name: paramName, ...restParam } = param

          parameters[paramName] = restParam

          const isRequired = param.isRequired || param.is_required || "false"
          if (isRequired.toString().toLowerCase() === "true") {
            requiredParameters.push(paramName)
          }
        }

        if (Object.keys(parameters).length > 0) {
          const properties: Record<string, any> = {}
          Object.keys(parameters).forEach((key) => {
            properties[key] = parameters[key]
          })

          const schema: Record<string, any> = {
            type: "object",
            properties,
          }

          if (requiredParameters.length > 0) {
            schema.required = requiredParameters
          }

          parameters = schema

          functionDefinition.parameters = parameters
        }

        chatPromptParseVisitor = chatPromptParseVisitor.addFunction(
          functionDefinition.name,
          functionDefinition.description,
          functionDefinition.parameters
        )
      }
    } catch (e) {
      this.LOGGER.error("error parsing prompt", e)
    }

    return chatPromptParseVisitor
  }
}
