import { PromptExecutionSettings } from "../../orchestration"

/**
 * Represents the settings for text to audio execution.
 */
export default class TextToAudioExecutionSettings<
  TextToAudioSettingsType extends Record<string, any> = Record<string, any>,
> extends PromptExecutionSettings<TextToAudioSettingsType> {}
