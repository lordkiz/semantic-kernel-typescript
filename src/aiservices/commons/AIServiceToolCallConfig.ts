import { FunctionChoiceBehaviorOptions } from "@semantic-kernel-typescript/core/functionchoice"

export interface AIServiceToolCallConfig<Tool, ToolChoice> {
  tools: Tool[]
  toolChoice: ToolChoice
  autoInvoke: boolean
  options?: FunctionChoiceBehaviorOptions
}
