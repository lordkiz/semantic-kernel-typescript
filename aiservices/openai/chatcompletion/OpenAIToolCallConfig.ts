import { FunctionChoiceBehaviorOptions } from "@semantic-kernel-typescript/core/functionchoice"
import { ChatCompletionTool, ChatCompletionToolChoiceOption } from "openai/resources"

export interface OpenAIToolCallConfig {
  tools: ChatCompletionTool[]
  toolChoice: ChatCompletionToolChoiceOption
  autoInvoke: boolean
  options?: FunctionChoiceBehaviorOptions
}
