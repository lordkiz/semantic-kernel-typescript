import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelHooks } from "@semantic-kernel-typescript/core/hooks"
import { KernelHookEvent } from "@semantic-kernel-typescript/core/hooks/types/KernelHookEvent"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"

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
}
