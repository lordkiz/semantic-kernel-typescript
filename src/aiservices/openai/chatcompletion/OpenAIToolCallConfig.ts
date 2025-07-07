import { ChatCompletionTool, ChatCompletionToolChoiceOption } from "openai/resources"
import FunctionChoiceBehaviorOptions from "../../../semantickernel/functionchoice/FunctionChoiceBehaviorOptions"

export interface OpenAIToolCallConfig {
  tools: ChatCompletionTool[]
  toolChoice: ChatCompletionToolChoiceOption
  autoInvoke: boolean
  options?: FunctionChoiceBehaviorOptions
}
