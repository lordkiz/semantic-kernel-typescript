import CaseInsensitiveMap from "../ds/CaseInsensitiveMap"
import KernelFunction from "../functions/KernelFunction"
import { Logger } from "../log/Logger"

/**
 * A plugin contains a collection of functions that can be invoked by the Semantic Kernel.
 */
export default class KernelPlugin implements Iterable<KernelFunction<any>> {
  private _name: string
  private _description: string
  private _functions: CaseInsensitiveMap<KernelFunction<any>>

  constructor(name: string, description: string, functions: KernelFunction<any>[]) {
    this._name = name
    this._description = description
    this._functions = new CaseInsensitiveMap<KernelFunction<unknown>>()

    functions?.forEach((fn) => {
      this.addFunction(fn)
    })
  }

  [Symbol.iterator](): Iterator<KernelFunction<unknown>, any, any> {
    return this._functions.values()[Symbol.iterator]()
  }

  /**
   * Gets a function by name.
   *
   * @param functionName The name of the function.
   * @param <T>          The return type of the function.
   * @return The function with the specified name, or {@code null} if no such function exists.
   */
  get(functionName: string) {
    return this._functions.get(functionName)
  }

  /**
   * Adds a function to the plugin.
   *
   * @param fn The function to add.
   */
  addFunction(fn: KernelFunction<any>) {
    if (this._functions.get(fn.getName())) {
      Logger.warn(`function ${fn.getName()} already exists overwriting existing function`)
    }

    this._functions.put(fn.getName(), fn)
  }

  /**
   * Gets the functions in the plugin.
   *
   * @return The functions in the plugin.
   */
  get functions() {
    return Object.seal(this._functions)
  }

  /**
   * Gets the name of the plugin.
   *
   * @return The name of the plugin.
   */
  get name() {
    return this._name
  }

  /**
   * Gets the description of the plugin.
   *
   * @return The description of the plugin.
   */
  get description() {
    return this._description
  }
}
