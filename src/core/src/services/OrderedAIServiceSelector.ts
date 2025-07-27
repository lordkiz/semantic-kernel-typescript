import KernelArguments from "../functions/KernelArguments"
import KernelFunction from "../functions/KernelFunction"
import { Logger } from "../log/Logger"
import PromptExecutionSettings from "../orchestration/PromptExecutionSettings"
import AIServiceCollection from "./AIServiceCollection"
import AIServiceSelection from "./AIServiceSelection"
import BaseAIServiceSelector from "./BaseAIServiceSelector"
import { AIService } from "./types/AIService"
import { ServiceType } from "./types/AIServiceSelector"

export default class OrderedAIServiceSelector extends BaseAIServiceSelector {
  private LOGGER = Logger
  constructor(services: AIServiceCollection = new AIServiceCollection()) {
    super(services)
  }

  trySelectAIService<T extends AIService>(
    serviceType: ServiceType<T>,
    kernelFunction?: KernelFunction<any>,
    kernelArguments?: KernelArguments,
    _services?: Map<ServiceType<T>, AIService>
  ): AIServiceSelection<T> | undefined {
    if (!kernelFunction) {
      return this.selectAIService(serviceType, kernelArguments?.getExecutionSettings())
    }

    return this.selectAIService(serviceType, kernelFunction.getExecutionSettings())
  }

  private selectAIService<T extends AIService>(
    serviceType: ServiceType<T>,
    executionSettings?: PromptExecutionSettings
  ): AIServiceSelection<T> | undefined {
    if (!executionSettings) {
      const service = this.getAnyService(serviceType)
      if (service) {
        return new AIServiceSelection(service) as AIServiceSelection<T>
      }
    } else {
      const serviceId = executionSettings.serviceId
      if (serviceId) {
        const service = this.getService(serviceId)
        if (service && service instanceof serviceType) {
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
    const service = this.getAnyService(serviceType)

    if (service) {
      return new AIServiceSelection(service, executionSettings) as AIServiceSelection<T>
    }

    console.warn("No service found meeting requirements")
  }

  private getServiceByModelId(modelId: string): AIService | undefined {
    for (const service of this.services.values()) {
      if (service.getModelId()?.toLowerCase() === modelId.toLowerCase()) {
        return service
      }
    }
    return undefined
  }

  getService(serviceId: string): AIService | undefined

  getService<T extends AIService>(serviceType: new (...args: any[]) => T): AIService | undefined

  getService<T extends AIService>(
    serviceTypeOrId: (new (...args: any[]) => T) | string
  ): T | undefined {
    if (typeof serviceTypeOrId === "string") {
      for (const service of this.services.values()) {
        if (service.getServiceId()?.toLowerCase() === serviceTypeOrId.toLowerCase()) {
          return service as T
        }
      }
    } else {
      const serviceType = serviceTypeOrId
      let service = this.services.get(serviceType)

      if (!service) {
        for (const [_, value] of this.services.entries()) {
          if (value instanceof serviceTypeOrId) {
            service = value as T
            break
          }
        }
      }

      if (
        !service &&
        (serviceType.name === "TextGenerationService" ||
          serviceType.name === "ChatCompletionService")
      ) {
        this.LOGGER.warn(
          `Requested a non-existent service type of ${serviceType.name}. ` +
            `Consider requesting a TextAIService instead.`
        )
      }

      return service as T
    }
  }

  protected getAnyService(serviceType: new (...args: any[]) => AIService): AIService | undefined {
    const matchingServices = this.getServices(serviceType)
    return matchingServices[0]
  }

  private getServices(serviceType: new (...args: any[]) => AIService): AIService[] {
    const services: AIService[] = []
    for (const [_, value] of this.services.entries()) {
      if (value instanceof serviceType) {
        services.push(value)
      }
    }
    return services
  }
}
