import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelHooks, PreChatCompletionEvent } from "@semantic-kernel-typescript/core/hooks"
import { KernelHookEvent } from "@semantic-kernel-typescript/core/hooks/types/KernelHookEvent"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import { ChatHistory } from "@semantic-kernel-typescript/core/services"

export class ChatCompletionUtils {
  static executeHook<T extends KernelHookEvent<any>>(
    event: T,
    invocationContext?: InvocationContext,
    kernel?: Kernel
  ): T {
    const kernelHooks = KernelHooks.merge(
      kernel?.getGlobalKernelHooks(),
      invocationContext?.kernelHooks
    )
    if (!kernelHooks) {
      return event
    }

    return kernelHooks.executeHooks(event)
  }

  static executePrechatHooks<OptionsType extends Record<string, any>>(
    options: OptionsType,
    chatHistory: ChatHistory,
    kernel: Kernel,
    invocationContext: InvocationContext<OptionsType>
  ): { options: OptionsType; chatHistory: ChatHistory } {
    const executedHook = ChatCompletionUtils.executeHook(
      new PreChatCompletionEvent(options, chatHistory),
      invocationContext,
      kernel
    )

    return { options: executedHook.options, chatHistory: executedHook.chatHistory }
  }
}
