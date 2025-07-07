import { AIService } from "../../semantickernel/services/types/AIService"

export abstract class OpenAIService<Client> implements AIService {
  private readonly client: Client
  private readonly serviceId: string | undefined
  private readonly modelId: string
  private readonly deploymentName: string

  constructor(client: Client, deploymentName: string, modelId: string, serviceId?: string) {
    this.client = client
    this.serviceId = serviceId
    this.modelId = modelId
    this.deploymentName = deploymentName
  }

  getClient(): Client {
    return this.client
  }

  getModelId(): string {
    return this.modelId
  }
  getServiceId(): string | undefined {
    return this.serviceId
  }

  getDeploymentName(): string {
    return this.deploymentName
  }
}
