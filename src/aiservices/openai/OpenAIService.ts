import { AIService } from "@semantic-kernel-typescript/core/services/types/AIService"

export abstract class OpenAIService<Client> implements AIService {
  private readonly _client: Client
  private readonly _serviceId: string | undefined
  private readonly _modelId: string
  private readonly _deploymentName: string

  constructor(client: Client, modelId: string, deploymentName: string, serviceId?: string) {
    this._client = client
    this._serviceId = serviceId
    this._modelId = modelId
    this._deploymentName = deploymentName
  }

  get client(): Client {
    return this._client
  }

  get modelId(): string {
    return this._modelId
  }
  get serviceId(): string | undefined {
    return this._serviceId
  }

  get deploymentName(): string {
    return this._deploymentName
  }
}
