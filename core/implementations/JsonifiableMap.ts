import lodash from "lodash"
import { JsonCreator, JsonCreatorClass } from "./JsonCreator"

export class JsonifiableMap<V = JsonCreator> extends Map<string, V> implements JsonCreatorClass {
  private _JSON_KEYS: Set<string>

  constructor(iterable?: Map<string, V>) {
    super(iterable)

    this._JSON_KEYS = new Set<string>()

    if (iterable) {
      for (const [key, value] of iterable.entries()) {
        this.addKey(key, value)
      }
    }
  }

  json() {
    const res: Record<string, any> = {}

    for (const k of this._JSON_KEYS) {
      // @ts-expect-error manual json keys
      res[k] = this[k]
    }

    return res
  }

  override set(key: string, value: V): this {
    this.addKey(key, value)
    return super.set(key, value)
  }

  override delete(key: string): boolean {
    this.removeKey(key)
    return super.delete(key)
  }

  private addKey(key: string, value: V) {
    if (!(value instanceof JsonCreator)) {
      throw TypeError("Value must be an instance of JsonCreator")
    }
    const snakedKey = lodash.snakeCase(key)
    // @ts-expect-error manual json keys
    this[snakedKey] = (value as JsonCreator).json()
    this._JSON_KEYS.add(snakedKey)
  }

  private removeKey(key: string) {
    const snakedKey = lodash.snakeCase(key)
    this._JSON_KEYS.delete(snakedKey)
    // @ts-expect-error manual json keys
    this[snakedKey] = undefined
  }
}
