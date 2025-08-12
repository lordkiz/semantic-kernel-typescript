import { v4 as uuidv4 } from "uuid"
import {
  FunctionInvokedHook,
  FunctionInvokingHook,
  KernelHook,
  PostChatCompletionHook,
  PreChatCompletionHook,
  PreToolCallHook,
  PromptRenderedHook,
  PromptRenderingHook,
} from "./KernelHook"
import { KernelHookEvent } from "./types/KernelHookEvent"

/**
 * Represents a collection of hooks that can be used to intercept and modify events in the kernel.
 */
export default class KernelHooks {
  private _hooks: Map<string, KernelHook<any>>

  constructor()
  constructor(kernelHooks: KernelHooks | Map<string, KernelHook<any>>)
  constructor(kernelHooks?: KernelHooks | Map<string, KernelHook<any>>) {
    this._hooks = new Map<string, KernelHook<any>>()

    let __hooks = new Map<string, KernelHook<any>>()

    if (kernelHooks && kernelHooks instanceof KernelHooks) {
      __hooks = kernelHooks.hooks
    }
    if (kernelHooks && kernelHooks instanceof Map) {
      __hooks = kernelHooks
    }
    for (const [k, v] of __hooks) {
      this._hooks.set(k, v)
    }
  }

  /**
   * Creates an unmodifiable copy of this {@link KernelHooks}.
   *
   * @return an unmodifiable copy of this {@link KernelHooks}
   */
  unmodifiableClone(): UnmodifiableKernelHooks {
    return UnmodifiableKernelHooks.construct(this)
  }

  /**
   * Gets the hooks in this collection.
   *
   * @return an unmodifiable map of the hooks
   */
  get hooks() {
    return Object.seal(this._hooks)
  }

  /**
   * Add a {@link FunctionInvokingHook} to the collection of hooks.
   *
   * @param fn the function to add
   * @return the key of the hook in the collection
   */
  addFunctionInvokingHook<T>(fnInvokingHook: FunctionInvokingHook<T>) {
    return this.addHook(fnInvokingHook)
  }

  /**
   * Add a {@link FunctionInvokedHook} to the collection of hooks.
   *
   * @param fn the function to add
   * @return the key of the hook in the collection
   */
  addFunctionInvokedHook<T>(fnInvokedHook: FunctionInvokedHook<T>) {
    return this.addHook(fnInvokedHook)
  }

  /**
   * Add a {@link PreChatCompletionHook} to the collection of hooks.
   *
   * @param function the function to add
   * @return the key of the hook in the collection
   */
  addPreChatCompletionHook(preChatCompletionHook: PreChatCompletionHook) {
    return this.addHook(preChatCompletionHook)
  }

  /**
   * Add a {@link PreToolCallHook} to the collection of hooks.
   *
   * @param function the function to add
   * @return the key of the hook in the collection
   */
  addPreToolCallHook(PreToolCallHook: PreToolCallHook) {
    return this.addHook(PreToolCallHook)
  }

  /**
   * Add a {@link PostChatCompletionEvent} to the collection of hooks.
   *
   * @param function the function to add
   * @return the key of the hook in the collection
   */
  addPostChatCompletionHook(postChatCompletionHook: PostChatCompletionHook) {
    return this.addHook(postChatCompletionHook)
  }

  /**
   * Add a {@link PromptRenderedHook} to the collection of hooks.
   *
   * @param function the function to add
   * @return the key of the hook in the collection
   */
  addPromptRenderedHook(promptRenderedHook: PromptRenderedHook) {
    return this.addHook(promptRenderedHook)
  }

  /**
   * Add a {@link PromptRenderingHook} to the collection of hooks.
   *
   * @param function the function to add
   * @return the key of the hook in the collection
   */
  addPromptRenderingHook(promptRenderingHook: PromptRenderingHook) {
    return this.addHook(promptRenderingHook)
  }

  /**
   * Executes the hooks in this collection that accept the event.
   *
   * @param event the event to execute the hooks on
   * @param <T>   the type of the event
   * @return the event after the hooks have been executed
   */
  executeHooks<T extends KernelHookEvent<any>>(event: T): T {
    return Array.from(this._hooks.values())
      .filter((it) => it.test(event))
      .sort((a, b) => b.priority - a.priority)
      .reduce((newEvent, hook) => {
        return hook.execute(newEvent)
      }, event)
  }

  /**
   * Appends the given hooks to this collection.
   *
   * @param kernelHooks the hooks to append
   * @return this instance of the {@link KernelHooks} class
   */
  addHook(hook: KernelHook<any>): string

  /**
   * Add a {@link KernelHook} to the collection of hooks.
   *
   * @param hookName the key of the hook in the collection
   * @param hook     the hook to add
   * @return the key of the hook in the collection
   */
  addHook(hook: KernelHook<any>, hookName: string): string

  /**
   * Add a {@link KernelHook} to the collection of hooks.
   *
   * @param hookName the key of the hook in the collection
   * @param hook     the hook to add
   * @return the key of the hook in the collection
   */
  addHook(hook: KernelHook<any>, hookName?: string): string {
    const key = hookName ?? uuidv4()
    this.hooks.set(key, hook)
    return key
  }

  /**
   * Appends the given hooks to this collection.
   *
   * @param kernelHooks the hooks to append
   * @return this instance of the {@link KernelHooks} class
   */
  addHooks(kernelHooks?: KernelHooks) {
    if (kernelHooks) {
      for (const [k, v] of kernelHooks.hooks) {
        this._hooks.set(k, v)
      }
    }
    return this
  }

  removeHook(hookName: string) {
    return this._hooks.delete(hookName)
  }

  /**
   * Determines if this collection of hooks is empty.
   *
   * @return {@code true} if the collection is empty, otherwise {@code false}
   */
  isEmpty(): boolean {
    return this._hooks.size === 0
  }

  /**
   * Builds the list of hooks to be invoked for the given context, by merging the hooks in this
   * collection with the hooks in the context. Duplicate hooks in b will override hooks in a.
   *
   * @param a hooks to merge
   * @param b hooks to merge
   * @return the list of hooks to be invoked
   */
  static merge(a?: KernelHooks, b?: KernelHooks): KernelHooks {
    let hooks = a
    if (!hooks) {
      hooks = new KernelHooks()
    }

    if (!b) {
      return hooks
    } else if (hooks.isEmpty()) {
      return b
    } else {
      const merged = new Map(hooks.hooks)
      for (const [k, v] of b.hooks) {
        merged.set(k, v)
      }
      return new KernelHooks(merged)
    }
  }
}

/**
 * A wrapper for KernelHooks that disables mutating methods.
 */
export class UnmodifiableKernelHooks extends KernelHooks {
  private constructor(kernelHooks: KernelHooks) {
    super(kernelHooks)
  }

  static construct(kernelHooks?: KernelHooks) {
    return new UnmodifiableKernelHooks(kernelHooks || new KernelHooks())
  }

  override addFunctionInvokingHook<T>(_fnInvokingHook: FunctionInvokingHook<T>): string {
    throw new TypeError("Unsupported operation")
  }

  override addFunctionInvokedHook<T>(_fnInvokedHook: FunctionInvokedHook<T>): string {
    throw new TypeError("Unsupported operation")
  }

  override addPreChatCompletionHook(_preChatCompletionHook: PreChatCompletionHook): string {
    throw new TypeError("Unsupported operation")
  }

  override addPreToolCallHook(_PreToolCallHook: PreToolCallHook): string {
    throw new TypeError("Unsupported operation")
  }

  override addPostChatCompletionHook(_postChatCompletionHook: PostChatCompletionHook): string {
    throw new TypeError("Unsupported operation")
  }

  override addPromptRenderedHook(_promptRenderedHook: PromptRenderedHook): string {
    throw new TypeError("Unsupported operation")
  }

  override addPromptRenderingHook(_promptRenderingHook: PromptRenderingHook): string {
    throw new TypeError("Unsupported operation")
  }

  override addHook(hook: KernelHook<any>): string

  override addHook(_hook: KernelHook<any>, _hookName?: string): string {
    throw new TypeError("Unsupported operation")
  }
}
