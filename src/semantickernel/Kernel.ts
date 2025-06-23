import { lastValueFrom, Observable } from "rxjs";
import KernelArguments from "./functions/KernelArguments";
import KernelFunction from "./functions/KernelFunction";
import KernelFunctionFactory from "./functions/KernelFunctionFactory";
import KernelHooks from "./hooks/KernelHooks";
import KernelPluginCollection from "./KernelPluginCollection";
import FunctionInvocation from "./orchestration/FunctionInvocation";
import FunctionResult from "./orchestration/FunctionResult";
import InvocationContext from "./orchestration/InvocationContext";
import KernelPlugin from "./plugin/KernelPlugin";
import AIServiceCollection from "./services/AIServiceCollection";
import OrderedAIServiceSelector from "./services/OrderedAIServiceSelector";
import { AIService } from "./services/types/AIService";
import { AIServiceSelector } from "./services/types/AIServiceSelector";

export default class Kernel {
  private readonly serviceSelector: AIServiceSelector;
  private readonly plugins: KernelPluginCollection;
  private readonly globalKernelHooks: KernelHooks;
  private readonly services: AIServiceCollection;
  private readonly serviceSelectorProvider?: (
    services: AIServiceCollection
  ) => AIServiceSelector;

  constructor(
    services: AIServiceCollection,
    serviceSelectorProvider?: (
      services: AIServiceCollection
    ) => AIServiceSelector,
    plugins?: KernelPlugin[],
    globalKernelHooks?: KernelHooks
  ) {
    this.services = services;
    this.serviceSelectorProvider = serviceSelectorProvider;

    this.serviceSelector = serviceSelectorProvider
      ? serviceSelectorProvider(services)
      : new OrderedAIServiceSelector(services);

    this.plugins = new KernelPluginCollection(plugins || []);
    this.globalKernelHooks = globalKernelHooks || new KernelHooks();
  }

  public static Builder(): KernelBuilder {
    return new KernelBuilder();
  }

  public static from(kernel: Kernel): KernelBuilder {
    return new KernelBuilder(
      kernel.services,
      kernel.serviceSelectorProvider,
      kernel.plugins
    );
  }

  public toBuilder(): KernelBuilder {
    return new KernelBuilder(
      this.services,
      this.serviceSelectorProvider,
      this.plugins
    );
  }

  public invokeAsync<T>(
    funcOrOpts: KernelFunction<T> | { pluginName: string; functionName: string }
  ): Observable<FunctionResult<T>> {
    let func: KernelFunction<T>;
    if (funcOrOpts instanceof KernelFunction) {
      func = funcOrOpts;
    } else {
      func = this.getFunction(funcOrOpts.pluginName, funcOrOpts.functionName);
    }
    return func.invokeAsync(this);
  }

  public async invoke<T>(
    funcOrOpts: KernelFunction<T> | { pluginName: string; functionName: string }
  ): Promise<FunctionResult<T>> {
    return lastValueFrom(this.invokeAsync(funcOrOpts));
  }

  public invokePromptAsync<T>(prompt: string): Observable<FunctionResult<T>> {
    return this.invokeAsync(
      KernelFunctionFactory.createFromPrompt<T>(prompt).build()
    );
  }

  public invokePromptWithArgsAsync<T>(
    prompt: string,
    args: KernelArguments
  ): Observable<FunctionResult<T>> {
    const func: KernelFunction<T> =
      KernelFunctionFactory.createFromPrompt<T>(prompt).build();
    return func.invokeAsync(this, args);
  }

  public invokePromptWithContextAsync<T>(
    prompt: string,
    args: KernelArguments,
    invocationContext: InvocationContext
  ): Observable<FunctionResult<T>> {
    const func: KernelFunction<T> =
      KernelFunctionFactory.createFromPrompt<T>(prompt).build();
    return func.invokeAsync(this, args, invocationContext);
  }

  public getPlugin(pluginName: string): KernelPlugin | undefined {
    return this.plugins.getPlugin(pluginName);
  }

  public getPlugins(): KernelPlugin[] {
    return this.plugins.getPlugins();
  }

  public getFunction<T>(
    pluginName: string,
    functionName: string
  ): KernelFunction<T> {
    const func = this.plugins.getFunction(pluginName, functionName);
    if (!func) {
      throw new Error(
        `Function ${functionName} not found in plugin ${pluginName}`
      );
    }
    return func as KernelFunction<T>;
  }

  public getFunctions(): KernelFunction<any>[] {
    return this.plugins.getFunctions();
  }

  public getGlobalKernelHooks(): KernelHooks {
    return this.globalKernelHooks;
  }

  public getServiceSelector(): AIServiceSelector {
    return this.serviceSelector;
  }

  public getService<T extends AIService>(
    serviceType: new (...args: any[]) => T
  ): T {
    const selection = this.serviceSelector.trySelectAIService(serviceType);
    if (!selection) {
      throw new Error(`Unable to find service of type ${serviceType.name}`);
    }
    return selection.getService();
  }

  public getServiceWithArgs<T extends AIService>(
    serviceType: new (...args: any[]) => T,
    args: KernelArguments
  ): T {
    const selection = this.serviceSelector.trySelectAIService(
      serviceType,
      undefined,
      args
    );
    if (!selection) {
      throw new Error(`Unable to find service of type ${serviceType.name}`);
    }
    return selection.getService();
  }
}

export class KernelBuilder {
  private services: AIServiceCollection = new AIServiceCollection();
  private plugins: KernelPlugin[] = [];
  private serviceSelectorProvider?: (
    services: AIServiceCollection
  ) => AIServiceSelector;

  constructor(
    services?: AIServiceCollection,
    serviceSelectorProvider?: (
      services: AIServiceCollection
    ) => AIServiceSelector,
    plugins?: KernelPluginCollection
  ) {
    if (services) this.services = new AIServiceCollection(services);
    this.serviceSelectorProvider = serviceSelectorProvider;
    if (plugins) this.plugins = [...plugins.getPlugins()];
  }

  public withAIService<T extends AIService>(
    serviceType: new (...args: any[]) => T,
    aiService: T
  ): KernelBuilder {
    this.services.set(serviceType, aiService);
    return this;
  }

  public withPlugin(plugin: KernelPlugin): KernelBuilder {
    this.plugins.push(plugin);
    return this;
  }

  public withServiceSelector(
    selectorProvider: (services: AIServiceCollection) => AIServiceSelector
  ): KernelBuilder {
    this.serviceSelectorProvider = selectorProvider;
    return this;
  }

  public build(): Kernel {
    return new Kernel(
      this.services,
      this.serviceSelectorProvider,
      this.plugins
    );
  }
}
