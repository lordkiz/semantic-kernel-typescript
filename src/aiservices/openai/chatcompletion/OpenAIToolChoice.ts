import { ChatCompletionNamedToolChoice } from "openai/resources"
import ToolCallBehavior from "../../../semantickernel/orchestration/ToolCallBehavior"

enum OpenAIToolChoiceEnum {
  AUTO = "auto",
  REQUIRED = "required",
  NONE = "none",
}

export const OpenAIToolChoice = {
  toForcedFunction(pluginName: string, functionName: string): ChatCompletionNamedToolChoice {
    return {
      type: "function",
      function: {
        name: `${pluginName}${ToolCallBehavior.FUNCTION_NAME_SEPARATOR}${functionName}`,
      },
    }
  },
  Option: OpenAIToolChoiceEnum,
}
