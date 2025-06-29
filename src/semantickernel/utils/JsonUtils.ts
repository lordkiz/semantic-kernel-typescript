import "reflect-metadata"
import { JsonPropertyOptions } from "../decorators/JsonProperty"
import { JsonCreator } from "../implementations/JsonCreator"
import { JsonifiableMap } from "../implementations/JsonifiableMap"

export class JsonUtils {
  static serialize<T>(instance: T): any {
    if (!instance) {
      return instance
    }

    let json: any = {}
    const prototype = Object.getPrototypeOf(instance)
    // Get all property keys
    const propertyKeys = Object.getOwnPropertyNames(prototype).concat(
      Object.getOwnPropertyNames(instance)
    )

    for (const propertyKey of propertyKeys) {
      // Skip constructor and non-properties
      if (propertyKey === "constructor") continue
      // Get metadata for this property
      const meta: JsonPropertyOptions = Reflect.getMetadata("json:property", prototype, propertyKey)
      if (prototype instanceof JsonifiableMap) {
        json = { ...json, ...prototype.json() }
      } else if (meta) {
        const jsonName = meta.name || propertyKey
        const value = (instance as any)[propertyKey]

        if (meta?.required && !value && meta?.defaultValue === undefined) {
          throw new Error(`found ${value} for required key ${jsonName}`)
        }

        // Handle serialization based on type
        if (value) {
          if (Array.isArray(value) || value instanceof Set) {
            const v = Array.from(value)
            json[jsonName] = v.map((item) =>
              item instanceof Object ? JsonUtils.serialize(item) : item
            )
          } else if (value instanceof JsonCreator) {
            json[jsonName] = value.json()
          } else if (value instanceof Object) {
            json[jsonName] = JsonUtils.serialize(value)
          } else {
            json[jsonName] = value
          }
        } else {
          json[jsonName] = value
        }
      }
    }
    return json
  }

  static deserialize<T>(json: any, type: new () => T): T {
    const instance = new type()
    const prototype = Object.getPrototypeOf(instance)
    // Get all property keys
    const propertyKeys = Object.getOwnPropertyNames(prototype)
    for (const propertyKey of propertyKeys) {
      // Skip constructor
      if (propertyKey === "constructor") continue
      // Get metadata for this property
      const meta: JsonPropertyOptions = Reflect.getMetadata("json:property", prototype, propertyKey)
      if (meta) {
        const jsonName = meta.name || propertyKey
        const jsonValue = json[jsonName]
        // Handle undefined values
        if (jsonValue === undefined) {
          if (meta.required) {
            throw new Error(`Required property ${jsonName} is missing`)
          }
          ;(instance as any)[propertyKey] = meta.defaultValue
          continue
        }
        // Handle deserialization based on type
        if (meta.type) {
          if (Array.isArray(jsonValue)) {
            ;(instance as any)[propertyKey] = jsonValue.map((item) =>
              JsonUtils.deserialize(item, meta.type!())
            )
          } else if (jsonValue instanceof Object) {
            ;(instance as any)[propertyKey] = JsonUtils.deserialize(jsonValue, meta.type!())
          } else {
            ;(instance as any)[propertyKey] = jsonValue
          }
        } else {
          ;(instance as any)[propertyKey] = jsonValue
        }
      }
    }
    return instance
  }
}
