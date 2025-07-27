import { ChatCompletionTool, ChatCompletionToolChoiceOption } from "openai/resources"
import FunctionChoiceBehaviorOptions from "../../../../core/src/functionchoice/FunctionChoiceBehaviorOptions"

export interface OpenAIToolCallConfig {
  tools: ChatCompletionTool[]
  toolChoice: ChatCompletionToolChoiceOption
  autoInvoke: boolean
  options?: FunctionChoiceBehaviorOptions
}
