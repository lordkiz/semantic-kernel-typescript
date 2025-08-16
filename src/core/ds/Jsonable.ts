type JSONPrimitive = string | number | boolean | JSONObject | JSONPrimitive[] | null | undefined

export type JSONObject = { [key: string]: JSONPrimitive } | JSONObject[]

export abstract class Jsonable {
  abstract toJsonObject(): JSONObject
}
