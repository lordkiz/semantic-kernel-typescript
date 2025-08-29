import { CaseInsensitiveMap } from "./ds/CaseInsensitiveMap"
import { SKException } from "./exceptions/SKException"
import { KernelFunction } from "./functions/KernelFunction"
import { KernelFunctionMetadata } from "./functions/KernelFunctionMetadata"
import { Logger } from "./log/Logger"
import { KernelPlugin } from "./plugin/KernelPlugin"

export class KernelPluginCollection {
  private _plugins = new CaseInsensitiveMap<KernelPlugin>()

  /**
   * Initialize a new instance of the {@link KernelPluginCollection} class with an empty
   * collection of plugins.
   */
  constructor()
  constructor(plugins: KernelPlugin[])

  /**
   * Initialize a new instance of the {@link KernelPluginCollection} class from a collection of
   * plugins.
   */
  constructor(plugins?: KernelPlugin[]) {
    plugins?.forEach((plugin) => this.putOrMerge(plugin.name, plugin))
  }

  private putOrMerge(pluginName: string, plugin: KernelPlugin) {
    if (this._plugins.contains(pluginName)) {
      plugin.functions.forEach((fn) => {
        this._plugins.get(pluginName)?.addFunction(fn)
      })
    } else {
      this._plugins.put(pluginName, plugin)
    }
  }

  /**
   * Gets the function with the given name from the plugin with the given name.
   *
   * @param pluginName   The name of the plugin containing the function.
   * @param functionName The name of the function to get.
   * @return The function with the given name from the plugin with the given name.
   * @throws IllegalArgumentException If the plugin or function is not found.
   */
  getFunction(pluginName: string, functionName: string): KernelFunction<any> {
    const plugin = this._plugins.get(pluginName)
    if (!plugin) {
      throw new SKException("Failed to find plugin " + pluginName)
    }
    const fn = plugin.get(functionName)

    if (!fn) {
      throw new SKException(
        "Function '" + functionName + "' not found in plugin '" + pluginName + "'"
      )
    }
    return fn
  }

  /**
   * Gets all functions from all plugins.
   *
   * @return A list of all functions from all plugins.
   */
  get functions(): KernelFunction<any>[] {
    return Array.from(this.plugins.values()).reduce((kernelFunctions, plugin) => {
      return [...kernelFunctions, ...Array.from(plugin.functions.values())]
    }, [] as KernelFunction<any>[])
  }

  /**
   * Gets all function metadata from all plugins.
   *
   * @return A list of all function metadata from all plugins.
   */
  get functionsMetadata(): KernelFunctionMetadata[] {
    return this.functions.map((kernelFunction) => kernelFunction.getMetadata())
  }

  /**
   * Gets all plugins that were added to the kernel.
   *
   * @return The plugins available through the kernel.
   */
  get plugins(): KernelPlugin[] {
    return Object.seal(Array.from(this._plugins.values()))
  }

  /**
   * Gets the plugin with the specified name.
   *
   * @param pluginName The name of the plugin to get.
   * @return The plugin with the specified name, or {@code null} if no such plugin exists.
   */
  getPlugin(pluginName: string): KernelPlugin | undefined {
    return this._plugins.get(pluginName)
  }

  /**
   * Adds a plugin to the collection. If a plugin with the same name already exists, it will be
   * replaced.
   *
   * @param plugin The plugin to add.
   */
  add(plugin: KernelPlugin) {
    if (this._plugins.has(plugin.name)) {
      Logger.warn("plugin already exists overwriting existing plugin")
    }

    this._plugins.put(plugin.name, plugin)
  }
}
