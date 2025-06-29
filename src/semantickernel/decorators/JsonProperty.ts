import "reflect-metadata"

export type JsonPropertyOptions = {
  name?: string
  type?: () => any
  required?: boolean
  defaultValue?: any
}

export const makeJsonProperty = (keyOrOptions?: string | JsonPropertyOptions) => {
  let key: string | undefined = undefined
  let options: JsonPropertyOptions | undefined = undefined
  if (typeof keyOrOptions === "string") {
    key = keyOrOptions
    options = {}
  } else {
    options = keyOrOptions as JsonPropertyOptions
  }

  return (target: object, propertyKey: string | symbol) => {
    const defaultOptions: JsonPropertyOptions = {
      name: key || propertyKey.toString(),
      required: false,
      ...options,
    }

    Reflect.defineMetadata("json:property", defaultOptions, target, propertyKey)

    const designType = Reflect.getMetadata("design:type", target, propertyKey)

    if (designType) {
      Reflect.defineMetadata("json:designType", designType, target, propertyKey)
    }
  }
}

export function JsonProperty(): PropertyDecorator
export function JsonProperty(key?: string): PropertyDecorator
export function JsonProperty(options?: JsonPropertyOptions): PropertyDecorator
export function JsonProperty(keyOrOptions?: string | JsonPropertyOptions): PropertyDecorator {
  return makeJsonProperty(keyOrOptions)
}
