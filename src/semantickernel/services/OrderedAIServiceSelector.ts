import KernelArguments from "../functions/KernelArguments"
import KernelFunction from "../functions/KernelFunction"
import { Logger } from "../log/Logger"
import ExecutionSettingsForService from "../orchestration/ExecutionSettingsForService"
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
    services?: Map<ServiceType<T>, AIService>
  ): AIServiceSelection<T> | undefined {
    if (!kernelFunction) {
      return this.selectAIService(serviceType, kernelArguments?.getExecutionSettings())
    }

    return this.selectAIService(serviceType, kernelFunction.getExecutionSettings())
  }

  private selectAIService<T extends AIService>(
    serviceType: ServiceType<T>,
    executionSettings?: ExecutionSettingsForService
  ): AIServiceSelection<T> | undefined {
    if (!executionSettings || executionSettings.size === 0) {
      const service = this.getAnyService(serviceType)
      if (service) {
        return new AIServiceSelection(service) as AIServiceSelection<T>
      }
    } else {
      for (const [serviceId, settings] of executionSettings) {
        if (serviceId) {
          const service = this.getService(serviceId)
          if (service) {
            return new AIServiceSelection(service, settings) as AIServiceSelection<T>
          }
        }
      }

      for (const [_, settings] of executionSettings) {
        if (settings?.getModelId()) {
          const service = this.getServiceByModelId(settings.getModelId())
          if (service) {
            return new AIServiceSelection(service, settings) as AIServiceSelection<T>
          }
        }
      }
    }

    // Fallback to default service
    const defaultService = this.getService(PromptExecutionSettings.DEFAULT_SERVICE_ID)
    if (defaultService && defaultService instanceof serviceType) {
      return new AIServiceSelection(defaultService) as AIServiceSelection<T>
    }

    // Final fallback
    const service = this.getAnyService(serviceType)
    let settings: PromptExecutionSettings | undefined

    if (executionSettings && executionSettings.size > 0) {
      settings =
        executionSettings.get(PromptExecutionSettings.DEFAULT_SERVICE_ID) ??
        Array.from(executionSettings.values())[0]
    }

    if (service) {
      return new AIServiceSelection(service, settings) as AIServiceSelection<T>
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
        for (const [key, value] of this.services.entries()) {
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
