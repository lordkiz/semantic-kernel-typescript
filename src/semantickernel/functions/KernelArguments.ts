import CaseInsensitiveMap from "../ds/CaseInsensitiveMap"
import SKException from "../exceptions/SKException"
import ExecutionSettingsForService from "../orchestration/ExecutionSettingsForService"
import PromptExecutionSettings from "../orchestration/PromptExecutionSettings"
import ContextVariable from "../variables/ContextVariable"

export default class KernelArguments implements Map<string, ContextVariable<any>> {
  /**
   * Default key for the main input.
   */
  static MAIN_KEY = "input"

  variables: CaseInsensitiveMap<ContextVariable<any>>
  executionSettings: ExecutionSettingsForService

  constructor()
  constructor(
    variables: Map<string, ContextVariable<any>>,
    executionSettings: ExecutionSettingsForService
  )
  constructor(
    variables?: Map<string, ContextVariable<any>>,
    executionSettings?: ExecutionSettingsForService
  ) {
    if (variables) {
      this.variables = new CaseInsensitiveMap<any>(variables)
    } else {
      this.variables = new CaseInsensitiveMap<any>()
    }

    this.executionSettings = executionSettings ?? ExecutionSettingsForService.create()
  }

  /**
   * Create a copy of the current instance
   *
   * @return copy of the current instance
   */
  copy() {
    return new KernelArguments(this.variables, this.executionSettings)
  }

  getExecutionSettings() {
    return Object.seal(this.executionSettings)
  }

  getInput() {
    return this.get(KernelArguments.MAIN_KEY)
  }

  clear(): void {
    this.variables.clear()
    this.size = this.variables.size
  }

  delete(key: string): boolean {
    const deleted = this.variables.delete(key)
    this.size = this.variables.size
    return deleted
  }

  forEach(
    callbackfn: (value: any, key: string, map: Map<string, any>) => void,
    thisArg?: any
  ): void {
    return this.variables.forEach(callbackfn, thisArg)
  }

  get(key: string) {
    return this.variables.get(key)
  }

  has(key: string): boolean {
    return this.variables.contains(key)
  }

  set(key: string, value: any): this {
    const v = value instanceof ContextVariable ? value : ContextVariable.of(value)
    this.variables.set(key, v)
    this.size = this.variables.size
    return this
  }

  size: number = 0

  entries(): MapIterator<[string, any]> {
    return this.variables.entries()
  }

  keys(): MapIterator<string> {
    return this.variables.keys()
  }

  values(): MapIterator<any> {
    return this.variables.values()
  }

  [Symbol.iterator](): MapIterator<[string, any]> {
    return this.variables[Symbol.iterator]()
  }

  get [Symbol.toStringTag](): string {
    return "KernelArguments"
  }

  private static _Builder = {
    variablez: new Map<string, any>(),
    executionSettingz: ExecutionSettingsForService.create(),

    withInput<T>(content: T) {
      this.variablez.set(KernelArguments.MAIN_KEY, content)
      return this
    },

    withVariable<T>(key: string, value: T) {
      this.variablez.set(key, value)
      return this
    },

    withVariables(map: Map<string, any>) {
      map.forEach((v, k) => this.variablez.set(k, v))
      return this
    },

    withExecutionSettingsMap(executionSettings: ExecutionSettingsForService) {
      executionSettings.forEach((v, k) => this.executionSettingz.set(k, v))
      return this
    },

    withExecutionSettingsArray(executionSettingsArray: PromptExecutionSettings[]) {
      for (const settings of executionSettingsArray) {
        const serviceId = settings.getServiceId()
        if (this.executionSettingz.has(serviceId)) {
          if (serviceId === PromptExecutionSettings.DEFAULT_SERVICE_ID) {
            throw new SKException(
              `Multiple prompt execution settings with the default service id '${PromptExecutionSettings.DEFAULT_SERVICE_ID}' or no service id have been provided. Specify a single default prompt execution settings and provide a unique service id for all other instances.`
            )
          }
          throw new SKException(
            `Multiple prompt execution settings with the service id '${serviceId}' have been provided. Specify a unique service id for all instances.`
          )
        }
        this.executionSettingz.set(serviceId, settings)
      }
      return this
    },

    withExecutionSettings(executionSettings: PromptExecutionSettings) {
      return this.withExecutionSettingsArray([executionSettings])
    },

    build(): KernelArguments {
      return new KernelArguments(this.variablez, this.executionSettingz)
    },
  }

  static Builder(): typeof KernelArguments._Builder {
    return KernelArguments._Builder
  }
}
