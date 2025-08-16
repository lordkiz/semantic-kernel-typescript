import { KernelFunction } from "../functions/KernelFunction"
import { KernelPlugin } from "../plugin"
import { FunctionChoiceBehaviorOptions } from "./FunctionChoiceBehaviorOptions"

/**
 * Defines the behavior of a tool call. Currently, the only tool available is function calling.
 */
export abstract class FunctionChoiceBehavior {
  private fullFunctionNames: Set<string>

  protected fns: KernelFunction<any>[]
  protected opts: FunctionChoiceBehaviorOptions

  constructor(plugins?: KernelPlugin[], options?: FunctionChoiceBehaviorOptions) {
    const kernelFunctions = (plugins ?? [])
      .map((plugin) => {
        const funcs = Array.from(plugin.functions.values())
        return funcs
      })
      .flatMap((it) => it)

    this.fns = kernelFunctions

    this.fullFunctionNames = new Set<string>()

    this.fns.forEach((fn) => {
      if (fn) {
        this.fullFunctionNames.add(
          FunctionChoiceBehavior.formFullFunctionName(fn.getPluginName(), fn.getName())
        )
      }
    })

    this.opts = options || FunctionChoiceBehaviorOptions.Builder().build()
  }

  /**
   * Gets the functions that are allowed.
   *
   * @return The functions that are allowed.
   */
  get functions() {
    return Object.seal(this.fns)
  }

  /**
   * Gets the options for the function choice behavior.
   *
   * @return The options for the function choice behavior.
   */
  get options() {
    return this.opts
  }

  /**
   * Form the full function name.
   *
   * @param pluginName   The name of the plugin that the function is in.
   * @param functionName The name of the function.
   * @return The key for the function.
   */
  static formFullFunctionName(pluginName: string, functionName: string): string {
    return `${pluginName}-${functionName}`
  }

  /**
   * Check whether the given function is allowed.
   *
   * @param fn The function to check.
   * @return Whether the function is allowed.
   */
  isKernelFunctionAllowed(fn: KernelFunction<any>) {
    return this.isFunctionAllowed(fn.getPluginName(), fn.getName())
  }

  /**
   * Check whether the given function is allowed.
   *
   * @param pluginName   The name of the skill that the function is in.
   * @param functionName The name of the function.
   * @return Whether the function is allowed.
   */
  isFunctionAllowed(pluginName: string, functionName: string) {
    const key = FunctionChoiceBehavior.formFullFunctionName(pluginName, functionName)
    return this.fullFunctionNames.has(key)
  }
}
