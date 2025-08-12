import KernelFunction from "../functions/KernelFunction"
import { Logger } from "../log/Logger"
import { ClassUtils } from "../utils/ClassUtils"
import KernelPlugin from "./KernelPlugin"

export default class KernelPluginFactory {
  static createFromObject(instance: InstanceType<any>, pluginName: string): KernelPlugin {
    const kernelFunctions = ClassUtils.getKernelFunctionBuildersFromInstance(instance).map((b) => {
      const fn = b.withPluginName(pluginName).build()
      return fn
    })

    const plugin = KernelPluginFactory.createFromFunctions(pluginName, "", kernelFunctions)

    if (plugin.functions.size === 0) {
      Logger.warn(`No functions found in instance ${instance.name}`)
    }
    return plugin
  }

  static createFromFunctions(
    pluginName: string,
    description?: string,
    fns?: KernelFunction<any>[]
  ): KernelPlugin {
    return new KernelPlugin(pluginName, description ?? "", fns ?? [])
  }
}
