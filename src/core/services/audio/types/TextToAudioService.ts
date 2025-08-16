import { Observable } from "rxjs"
import { AIService } from "../../types/AIService"
import { AudioContent } from "../AudioContent"
import { TextToAudioExecutionSettings } from "../TextToAudioExecutionSettings"

/**
 * Provides audio to text service.
 */
export interface TextToAudioService extends AIService {
  /**
   * Get audio content from text.
   *
   * @param sampleText        The sample text.
   * @param executionSettings The AI execution settings.
   * @return Audio content from text.
   */
  getAudioContentAsync(
    sampleText: string,
    executionSettings: TextToAudioExecutionSettings<any>
  ): Observable<AudioContent>
}
