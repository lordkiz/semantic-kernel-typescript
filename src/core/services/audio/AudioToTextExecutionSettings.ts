import { PromptExecutionSettings } from "../../orchestration"

/**
 * Represents audio to text execution settings.
 */
export default class AudioToTextExecutionSettings<
  AudioToTextSettingsType extends Record<string, any> = Record<string, any>,
> extends PromptExecutionSettings<AudioToTextSettingsType> {}
