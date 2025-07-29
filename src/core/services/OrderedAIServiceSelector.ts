import KernelArguments from "../functions/KernelArguments"
import KernelFunction from "../functions/KernelFunction"
import { Logger } from "../log/Logger"
import PromptExecutionSettings from "../orchestration/PromptExecutionSettings"
import AIServiceCollection from "./AIServiceCollection"
import AIServiceSelection from "./AIServiceSelection"
import BaseAIServiceSelector from "./BaseAIServiceSelector"
import { AIService } from "./types/AIService"
import { ServiceClass } from "./types/AIServiceSelector"

export default class OrderedAIServiceSelector extends BaseAIServiceSelector {
  private LOGGER = Logger
  constructor(services: AIServiceCollection = new AIServiceCollection()) {
    super(services)
  }

  trySelectAIService<T extends AIService>(
    serviceClass: ServiceClass<T>,
    kernelFunction?: KernelFunction<any>,
    kernelArguments?: KernelArguments,
    _services?: Map<ServiceClass<T>, AIService>
  ): AIServiceSelection<T> | undefined {
    if (!kernelFunction) {
      return this.selectAIService(serviceClass, kernelArguments?.getExecutionSettings())
    }

    return this.selectAIService(serviceClass, kernelFunction.getExecutionSettings())
  }

  private selectAIService<T extends AIService>(
    serviceClass: ServiceClass<T>,
    executionSettings?: PromptExecutionSettings
  ): AIServiceSelection<T> | undefined {
    if (!executionSettings) {
      const service = this.getAnyService(serviceClass)
      if (service) {
        return new AIServiceSelection(service) as AIServiceSelection<T>
      }
    } else {
      const serviceId = executionSettings.serviceId
      if (serviceId) {
        const service = this.getService(serviceId)
        if (service && service instanceof serviceClass) {
          return new AIServiceSelection(service, executionSettings) as AIServiceSelection<T>
        }
      }

      for (const [k, _] of executionSettings) {
        if (k === "modelId") {
          const service = this.getServiceByModelId(executionSettings.get("modelId"))
          if (service) {
            return new AIServiceSelection(service, executionSettings) as AIServiceSelection<T>
          }
        }
      }
    }

    // Final fallback
    const service = this.getAnyService(serviceClass)

    if (service) {
      return new AIServiceSelection(service, executionSettings) as AIServiceSelection<T>
    }

    console.warn("No service found meeting requirements")
  }

  getServiceByModelId(modelId: string): AIService | undefined {
    for (const service of this.services.values()) {
      if (service.modelId?.toLowerCase() === modelId.toLowerCase()) {
        return service
      }
    }
    return undefined
  }

  getService(serviceId: string): AIService | undefined

  getService<T extends AIService>(serviceClass: new (...args: any[]) => T): AIService | undefined

  getService<T extends AIService>(
    serviceClassOrId: (new (...args: any[]) => T) | string
  ): T | undefined {
    if (typeof serviceClassOrId === "string") {
      for (const service of this.services.values()) {
        if (service.serviceId?.toLowerCase() === serviceClassOrId.toLowerCase()) {
          return service as T
        }
      }
    } else {
      const serviceClass = serviceClassOrId
      const serviceClassKey = Symbol(serviceClass.name)

      let service = this.services.get(serviceClassKey)

      if (!service) {
        for (const [_, value] of this.services.entries()) {
          if (value instanceof serviceClass) {
            service = value as T
            break
          }
        }
      }

      if (
        !service &&
        (serviceClass.name === "TextGenerationService" ||
          serviceClass.name === "ChatCompletionService")
      ) {
        this.LOGGER.warn(
          `Requested a non-existent service type of ${serviceClass.name}. ` +
            `Consider requesting a TextAIService instead.`
        )
      }

      return service as T
    }
  }

  protected getAnyService(serviceClass: new (...args: any[]) => AIService): AIService | undefined {
    const matchingServices = this.getServices(serviceClass)
    return matchingServices[0]
  }

  private getServices(serviceClass: new (...args: any[]) => AIService): AIService[] {
    const services: AIService[] = []
    for (const [_, value] of this.services.entries()) {
      if (value instanceof serviceClass) {
        services.push(value)
      }
    }
    return services
  }
}
