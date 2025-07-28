import { GoogleGenAI } from "@google/genai"
import { AIService } from "@semantic-kernel-typescript/core/services"

export abstract class GeminiService implements AIService {
  private _client: GoogleGenAI
  private _modelId: string
  private readonly _serviceId: string | undefined
  private readonly _deploymentName: string | undefined

  constructor(client: GoogleGenAI, modelId: string, deploymentName?: string, serviceId?: string) {
    this._client = client
    this._modelId = modelId
    this._deploymentName = deploymentName
    this._serviceId = serviceId
  }

  get modelId(): string {
    return this._modelId
  }
  get serviceId(): string | undefined {
    return this._serviceId
  }

  get client(): GoogleGenAI {
    return this._client
  }
}
