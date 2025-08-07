import PromptExecutionSettings from "../orchestration/PromptExecutionSettings"
import ContextVariable from "../variables/ContextVariable"

export default class KernelArguments<
  ExecutionSettingsType extends Record<string, any> = Record<string, any>,
> implements Map<string, ContextVariable<any>>
{
  /**
   * Default key for the main input.
   */
  static MAIN_KEY = "input"

  variables: Map<string, ContextVariable<any>>
  executionSettings: PromptExecutionSettings<ExecutionSettingsType>

  constructor()
  constructor(
    variables: Map<string, ContextVariable<any>>,
    executionSettings: PromptExecutionSettings<ExecutionSettingsType>
  )
  constructor(
    variables?: Map<string, ContextVariable<any>>,
    executionSettings?: PromptExecutionSettings<ExecutionSettingsType>
  ) {
    if (variables) {
      this.variables = new Map<string, ContextVariable<any>>(variables)
    } else {
      this.variables = new Map<string, ContextVariable<any>>()
    }

    this.executionSettings =
      executionSettings ?? PromptExecutionSettings.Builder<ExecutionSettingsType>().build()
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
    return this.variables.get(KernelArguments.MAIN_KEY)
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
    return this.variables.has(key)
  }

  set(key: string, value: any): this {
    const v = value instanceof ContextVariable ? value : ContextVariable.of(value)
    this.variables.set(key, v)
    this.size = this.variables.size
    return this
  }

  size: number = 0

  entries() {
    return this.variables.entries()
  }

  keys() {
    return this.variables.keys()
  }

  values() {
    return this.variables.values()
  }

  [Symbol.iterator]() {
    return this.variables[Symbol.iterator]()
  }

  get [Symbol.toStringTag](): string {
    return "KernelArguments"
  }

  private static _Builder = {
    variablez: new Map<string, ContextVariable<any>>(),
    executionSettingz: PromptExecutionSettings.Builder<any>().build(),

    withInput<T>(content: T) {
      const v = content instanceof ContextVariable ? content : ContextVariable.of(content)
      this.variablez.set(KernelArguments.MAIN_KEY, v)
      return this
    },

    withVariable<T>(key: string, value: T) {
      const v = value instanceof ContextVariable ? value : ContextVariable.of(value)
      this.variablez.set(key, v)
      return this
    },

    withVariables(map: Map<string, any>) {
      map.forEach((v, k) => {
        const val = v instanceof ContextVariable ? v : ContextVariable.of(v)
        this.variablez.set(k, val)
      })
      return this
    },

    withExecutionSettings(executionSettings: PromptExecutionSettings) {
      this.executionSettingz = executionSettings
      return this
    },

    build(): KernelArguments {
      return new KernelArguments(this.variablez, this.executionSettingz)
    },
  }

  static Builder(): typeof KernelArguments._Builder {
    return KernelArguments._Builder
  }
}
