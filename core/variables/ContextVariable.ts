import { Logger } from "../log/Logger"

export class ContextVariable<T> {
  private _value: T
  constructor(value: T) {
    this._value = value
  }

  static of<T>(value: T): ContextVariable<T> {
    return new ContextVariable(value)
  }

  get rawValue() {
    return this._value
  }

  get value() {
    return this.resolveValue()
  }

  get type() {
    return typeof this.resolveValue()
  }

  private resolveValue(): T {
    try {
      if (
        typeof this._value === "string" &&
        (this._value.startsWith("[") || this._value.startsWith("{"))
      ) {
        return JSON.parse(this._value) as T
      }
      return this.rawValue
    } catch (e) {
      Logger.warn(`encountered error while resolving value. Returning raw value. Error: ${e}`)

      return this.rawValue
    }
  }
}
