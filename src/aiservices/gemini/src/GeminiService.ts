import { GoogleGenAI } from "@google/genai"
import { AIService } from "../../../core/src/services/types/AIService"

export abstract class GeminiService implements AIService {
  private client: GoogleGenAI
  private modelId: string
  private readonly serviceId: string | undefined
  private readonly deploymentName: string | undefined

  constructor(client: GoogleGenAI, modelId: string, deploymentName?: string, serviceId?: string) {
    this.client = client
    this.modelId = modelId
    this.deploymentName = deploymentName
    this.serviceId = serviceId
  }

  getModelId(): string {
    return this.modelId
  }
  getServiceId(): string | undefined {
    return this.serviceId
  }

  getClient(): GoogleGenAI {
    return this.client
  }
}
