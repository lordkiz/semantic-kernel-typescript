import { Logger } from "../log/Logger"

export default class ContextVariable<T> {
  private value: T
  constructor(value: T) {
    this.value = value
  }

  static of<T>(value: T): ContextVariable<T> {
    return new ContextVariable(value)
  }

  getRawValue() {
    return this.value
  }

  getValue() {
    return this.resolveValue()
  }

  getType() {
    return typeof this.value
  }

  private resolveValue(): T {
    try {
      if (typeof this.value === "string") {
        return JSON.parse(this.value) as T
      }
      return this.value
    } catch (e) {
      Logger.warn(`encountered error while resolving value. Returning raw value. Error: ${e}`)

      return this.getRawValue()
    }
  }
}
