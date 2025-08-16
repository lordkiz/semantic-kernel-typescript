import { lastValueFrom, Observable } from "rxjs"
import { KernelArguments } from "./functions/KernelArguments"
import { KernelFunction } from "./functions/KernelFunction"
import { KernelFunctionFactory } from "./functions/KernelFunctionFactory"
import { KernelHooks } from "./hooks/KernelHooks"
import { KernelPluginCollection } from "./KernelPluginCollection"
import { FunctionResult } from "./orchestration/FunctionResult"
import { InvocationContext } from "./orchestration/InvocationContext"
import { KernelPlugin } from "./plugin/KernelPlugin"
import { AIServiceCollection } from "./services/AIServiceCollection"
import { OrderedAIServiceSelector } from "./services/OrderedAIServiceSelector"
import { AIService } from "./services/types/AIService"
import { AIServiceSelector } from "./services/types/AIServiceSelector"

export class Kernel {
  private readonly serviceSelector: AIServiceSelector
  private readonly _plugins: KernelPluginCollection
  private readonly globalKernelHooks: KernelHooks
  private readonly services: AIServiceCollection
  private readonly serviceSelectorProvider?: (services: AIServiceCollection) => AIServiceSelector

  constructor(
    services: AIServiceCollection,
    serviceSelectorProvider?: (services: AIServiceCollection) => AIServiceSelector,
    plugins?: KernelPlugin[],
    globalKernelHooks?: KernelHooks
  ) {
    this.services = services
    this.serviceSelectorProvider = serviceSelectorProvider

    this.serviceSelector = serviceSelectorProvider
      ? serviceSelectorProvider(services)
      : new OrderedAIServiceSelector(services)

    this._plugins = new KernelPluginCollection(plugins || [])
    this.globalKernelHooks = globalKernelHooks || new KernelHooks()
  }

  public static Builder(): KernelBuilder {
    return new KernelBuilder()
  }

  public toBuilder(): KernelBuilder {
    return new KernelBuilder(this.services, this.serviceSelectorProvider, this._plugins)
  }

  public invokeAsync<T>(
    functionOrOptionsOrPrompt:
      | KernelFunction<T>
      | { pluginName: string; functionName: string }
      | string,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext<any>
  ): Observable<FunctionResult<T>> {
    let func: KernelFunction<T>
    if (functionOrOptionsOrPrompt instanceof KernelFunction) {
      func = functionOrOptionsOrPrompt
    } else if (typeof functionOrOptionsOrPrompt === "string") {
      func = KernelFunctionFactory.createFromPrompt<T>(functionOrOptionsOrPrompt).build()
    } else {
      func = this.getFunction(
        functionOrOptionsOrPrompt.pluginName,
        functionOrOptionsOrPrompt.functionName
      )
    }
    return func.invokeAsync(this, kernelArguments, invocationContext)
  }

  public async invoke<T>(
    funcOrOpts: KernelFunction<T> | { pluginName: string; functionName: string },
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext<any>
  ): Promise<FunctionResult<T>> {
    return lastValueFrom(this.invokeAsync(funcOrOpts, kernelArguments, invocationContext))
  }

  public invokePromptAsync<T>(
    prompt: string,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext<any>
  ): Observable<FunctionResult<T>> {
    return this.invokeAsync(prompt, kernelArguments, invocationContext)
  }

  public getPlugin(pluginName: string): KernelPlugin | undefined {
    return this._plugins.getPlugin(pluginName)
  }

  public get plugins(): KernelPlugin[] {
    return this._plugins.plugins
  }

  public getFunction<T>(pluginName: string, functionName: string): KernelFunction<T> {
    const func = this._plugins.getFunction(pluginName, functionName)

    if (!func) {
      throw new Error(`Function ${functionName} not found in plugin ${pluginName}`)
    }

    return func as KernelFunction<T>
  }

  public get functions(): KernelFunction<any>[] {
    return this._plugins.functions
  }

  public getGlobalKernelHooks(): KernelHooks {
    return this.globalKernelHooks
  }

  public getServiceSelector(): AIServiceSelector {
    return this.serviceSelector
  }

  public getService<T extends AIService>(serviceClass: new (...args: any[]) => T): T {
    const selection = this.serviceSelector.trySelectAIService(serviceClass)
    if (!selection) {
      throw new Error(`Unable to find service of type ${serviceClass.name}`)
    }
    return selection.getService()
  }

  public getServiceWithArgs<T extends AIService>(
    serviceClass: new (...args: any[]) => T,
    args: KernelArguments
  ): T {
    const selection = this.serviceSelector.trySelectAIService(serviceClass, undefined, args)
    if (!selection) {
      throw new Error(`Unable to find service of type ${serviceClass.name}`)
    }
    return selection.getService()
  }
}

export class KernelBuilder {
  private services: AIServiceCollection = new AIServiceCollection()
  private plugins: KernelPlugin[] = []
  private serviceSelectorProvider?: (services: AIServiceCollection) => AIServiceSelector

  constructor(
    services?: AIServiceCollection,
    serviceSelectorProvider?: (services: AIServiceCollection) => AIServiceSelector,
    plugins?: KernelPluginCollection
  ) {
    if (services) this.services = new AIServiceCollection(services)
    this.serviceSelectorProvider = serviceSelectorProvider
    if (plugins) this.plugins = [...plugins.plugins]
  }

  public withAIService<T extends AIService>(
    serviceClass: new (...args: any[]) => T,
    aiService: T
  ): KernelBuilder {
    this.services.set(Symbol(serviceClass.name), aiService)
    return this
  }

  public withPlugin(plugin: KernelPlugin): KernelBuilder {
    this.plugins.push(plugin)
    return this
  }

  public withServiceSelector(
    selectorProvider: (services: AIServiceCollection) => AIServiceSelector
  ): KernelBuilder {
    this.serviceSelectorProvider = selectorProvider
    return this
  }

  public build(): Kernel {
    return new Kernel(this.services, this.serviceSelectorProvider, this.plugins)
  }
}
