import { JsonifiableMap } from "../implementations/JsonifiableMap"
import PromptExecutionSettings from "./PromptExecutionSettings"

type ServiceID = string

export default class ExecutionSettingsForService extends JsonifiableMap<PromptExecutionSettings> {
  private constructor() {
    super()
  }

  static create(
    serviceId?: ServiceID,
    promptExecutionSettings?: PromptExecutionSettings
  ): ExecutionSettingsForService {
    const execSettings = new ExecutionSettingsForService()

    execSettings.set(
      serviceId ?? PromptExecutionSettings.DEFAULT_SERVICE_ID,
      promptExecutionSettings ?? PromptExecutionSettings.Builder().build()
    )

    return execSettings
  }
}
