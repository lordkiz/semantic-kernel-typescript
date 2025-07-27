import SemanticKernelBuilder from "../../builders/SemanticKernelBuilder";
import { AIService } from "../types/AIService";

/**
 * Builder for an OpenAI service.
 * @param <C> The client type
 * @param <T> The service type
 * @param <U> The builder type
 */
export abstract class OpenAiServiceBuilder<
  C,
  T extends AIService,
  U extends OpenAiServiceBuilder<C, T, U>
> implements SemanticKernelBuilder<T>
{
  protected modelId: string | undefined;

  protected client: C | undefined;

  protected serviceId: string | undefined;

  protected deploymentName: string | undefined;

  /**
   * Sets the model ID for the service.
   * <p>
   * If no deployment name is provided, it will be assumed that this model ID is also the
   * deployment name.
   *
   * @param modelId The model ID
   * @return The builder
   */
  public withModelId(modelId: string) {
    this.modelId = modelId;
    return this;
  }

  /**
   * Sets the deployment name for the service if required.
   *
   * @param deploymentName The deployment name
   * @return The builder
   */
  withDeploymentName(deploymentName: string) {
    this.deploymentName = deploymentName;
    return this;
  }

  /**
   * Sets the OpenAI client for the service
   *
   * @param client The OpenAI client
   * @return The builder
   */
  withOpenAIAsyncClient(client: C) {
    this.client = client;
    return this;
  }

  /**
   * Sets the service ID for the service
   *
   * @param serviceId The service ID
   * @return The builder
   */
  withServiceId(serviceId: string) {
    this.serviceId = serviceId;
    return this;
  }

  /**
   * Builds the service.
   * @return The service
   */
  public abstract build(): T;
}
