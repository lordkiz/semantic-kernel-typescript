import CaseInsensitiveMap from "./ds/CaseInsensitiveMap";
import SKException from "./exceptions/SKException";
import KernelFunction from "./functions/KernelFunction";
import KernelFunctionMetadata from "./functions/KernelFunctionMetadata";
import { Logger } from "./log/Logger";
import KernelPlugin from "./plugin/KernelPlugin";

export default class KernelPluginCollection {
  private LOGGER = Logger;

  private plugins = new CaseInsensitiveMap<KernelPlugin>();

  /**
   * Initialize a new instance of the {@link KernelPluginCollection} class with an empty
   * collection of plugins.
   */
  constructor();
  constructor(plugins: KernelPlugin[]);

  /**
   * Initialize a new instance of the {@link KernelPluginCollection} class from a collection of
   * plugins.
   */
  constructor(plugins?: KernelPlugin[]) {
    plugins?.forEach((plugin) => this.putOrMerge(plugin.getName(), plugin));
  }

  private putOrMerge(pluginName: string, plugin: KernelPlugin) {
    if (this.plugins.contains(pluginName)) {
      plugin.getFunctions().forEach((fn) => {
        this.plugins.get(pluginName)?.addFunction(fn);
      });
    } else {
      this.plugins.put(pluginName, plugin);
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
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new SKException("Failed to find plugin " + pluginName);
    }
    const fn = plugin.get(functionName);

    if (!fn) {
      throw new SKException(
        "Function '" +
          functionName +
          "' not found in plugin '" +
          pluginName +
          "'"
      );
    }
    return fn;
  }

  /**
   * Gets all functions from all plugins.
   *
   * @return A list of all functions from all plugins.
   */
  getFunctions(): KernelFunction<any>[] {
    return Array.from(this.plugins.values()).reduce(
      (kernelFunctions, plugin) => {
        return [
          ...kernelFunctions,
          ...Array.from(plugin.getFunctions().values()),
        ];
      },
      [] as KernelFunction<any>[]
    );
  }

  /**
   * Gets all function metadata from all plugins.
   *
   * @return A list of all function metadata from all plugins.
   */
  getFunctionsMetadata(): KernelFunctionMetadata<any>[] {
    return this.getFunctions().map((kernelFunction) =>
      kernelFunction.getMetadata()
    );
  }

  /**
   * Gets all plugins that were added to the kernel.
   *
   * @return The plugins available through the kernel.
   */
  getPlugins(): KernelPlugin[] {
    return Object.seal(Array.from(this.plugins.values()));
  }

  /**
   * Gets the plugin with the specified name.
   *
   * @param pluginName The name of the plugin to get.
   * @return The plugin with the specified name, or {@code null} if no such plugin exists.
   */
  getPlugin(pluginName: string): KernelPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Adds a plugin to the collection. If a plugin with the same name already exists, it will be
   * replaced.
   *
   * @param plugin The plugin to add.
   */
  add(plugin: KernelPlugin) {
    if (this.plugins.has(plugin.getName())) {
      this.LOGGER.warn("plugin already exists overwriting existing plugin");
    }

    this.plugins.put(plugin.getName(), plugin);
  }
}
