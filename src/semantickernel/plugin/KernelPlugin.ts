import CaseInsensitiveMap from "../ds/CaseInsensitiveMap";
import KernelFunction from "../functions/KernelFunction";

/**
 * A plugin contains a collection of functions that can be invoked by the Semantic Kernel.
 */
export default class KernelPlugin
  implements Iterable<KernelFunction<unknown>, any, any>
{
  private name: string;
  private description: string;
  private fns: CaseInsensitiveMap<KernelFunction<unknown>>;

  constructor(
    name: string,
    description: string,
    plugins: Map<string, KernelFunction<unknown>>
  ) {
    this.name = name;
    this.description = description;
    this.fns = new CaseInsensitiveMap<KernelFunction<unknown>>();

    this.fns.putAll(plugins as CaseInsensitiveMap<KernelFunction<unknown>>);
  }

  [Symbol.iterator](): Iterator<KernelFunction<unknown>, any, any> {
    return this.fns.values()[Symbol.iterator]();
  }

  /**
   * Gets a function by name.
   *
   * @param functionName The name of the function.
   * @param <T>          The return type of the function.
   * @return The function with the specified name, or {@code null} if no such function exists.
   */
  get(functionName: string) {
    return this.fns.get(functionName);
  }

  /**
   * Adds a function to the plugin.
   *
   * @param fn The function to add.
   */
  addFunction(fn: KernelFunction<unknown>) {
    this.fns.put(fn.getName(), fn);
  }

  /**
   * Gets the functions in the plugin.
   *
   * @return The functions in the plugin.
   */
  getFunctions() {
    return Object.seal(this.fns);
  }

  /**
   * Gets the name of the plugin.
   *
   * @return The name of the plugin.
   */
  getName() {
    return this.name;
  }

  /**
   * Gets the description of the plugin.
   *
   * @return The description of the plugin.
   */
  getDescription() {
    return this.description;
  }
}
