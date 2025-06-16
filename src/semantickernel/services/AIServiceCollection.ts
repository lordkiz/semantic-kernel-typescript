import { AIService } from "./types/AIService";
import { ServiceType } from "./types/AIServiceSelector";

/**
 * A collection of AI services.
 */
export default class AIServiceCollection extends Map<
  ServiceType<any>,
  AIService
> {}
