import KernelArguments from "../../functions/KernelArguments";
import KernelFunction from "../../functions/KernelFunction";
import AIServiceSelection from "../AIServiceSelection";
import { AIService } from "./AIService";

export type ServiceType<T extends AIService> = { new (...args: any[]): T };

export interface AIServiceSelector {
  /**
   * Resolves an {@link AIService} and associated and
   * {@link PromptExecutionSettings} based on the
   * associated {@link KernelFunction} and {@link KernelArguments}.
   *
   * @param serviceType The type of service to select.  This must be the same type with which the
   *                    service was registered in the {@link AIServiceSelection}
   * @param fn    The KernelFunction to use to select the service, or {@code null}.
   * @param kernelArguments   The KernelArguments to use to select the service, or
   *                    {@code null}.
   * @param <T>         The type of service to select.
   * @return An {@code AIServiceSelection} containing the selected service and associated
   * PromptExecutionSettings.
   */
  trySelectAIService<T extends AIService>(
    serviceType: ServiceType<T>,
    fn?: KernelFunction<any>,
    kernelArguments?: KernelArguments,
    services?: Map<ServiceType<T>, T>
  ): AIServiceSelection<T> | undefined;
}
