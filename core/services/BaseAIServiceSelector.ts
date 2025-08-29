import { KernelArguments } from "../functions/KernelArguments"
import { KernelFunction } from "../functions/KernelFunction"
import { AIServiceCollection } from "./AIServiceCollection"
import { AIServiceSelection } from "./AIServiceSelection"
import { AIService } from "./types/AIService"
import { AIServiceSelector, ServiceClass } from "./types/AIServiceSelector"

/**
 * Base class for {@link AIServiceSelector} implementations which provides a {@code Map} based
 * collection from which an {@link AIService} can be selected. The
 * {@link #trySelectAIService(Class, KernelFunction, KernelArguments)} method has been
 * implemented. Child classes must implement the method
 * {@link #trySelectAIService(Class, KernelFunction, KernelArguments, Map)}.
 */
export abstract class BaseAIServiceSelector implements AIServiceSelector {
  protected services: AIServiceCollection

  /**
   * Initializes a new instance of the {@link BaseAIServiceSelector} class.
   *
   * @param services The services to select from.
   */
  constructor(services: AIServiceCollection) {
    this.services = services
  }

  /**
   * Resolves an {@link AIService} from the {@code services} argument using the specified
   * {@code function} and {@code arguments} for selection.
   *
   * @param serviceClass The type of service to select.  This must be the same type with which the
   *                    service was registered in the {@link AIServiceSelection}
   * @param fn    The KernelFunction to use to select the service, or {@code null}.
   * @param kernelArguments   The KernelFunctionArguments to use to select the service, or
   *                    {@code null}.
   * @param services    The services to select from.
   * @param <T>         The type of service to select.
   * @return The selected service, or {@code null} if no service could be selected.
   *
   */
  abstract trySelectAIService<T extends AIService>(
    serviceClass: ServiceClass<T>,
    fn?: KernelFunction<any>,
    kernelArguments?: KernelArguments,
    services?: Map<ServiceClass<T>, AIService>
  ): AIServiceSelection<T> | undefined
}
