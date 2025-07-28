import { Observable } from "rxjs"
import { AIService } from "../../types/AIService"
import AudioContent from "../AudioContent"
import AudioToTextExecutionSettings from "../AudioToTextExecutionSettings"

export interface AudioToTextService extends AIService {
  /**
   * Get text contents from audio content.
   *
   * @param content           Audio content.
   * @param executionSettings The AI execution settings (optional).
   * @return Text contents from audio content.
   */
  getTextContentsAsync(
    content: AudioContent,
    executionSettings?: AudioToTextExecutionSettings
  ): Observable<string>
}
