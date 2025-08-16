export class CaseInsensitiveMap<V> extends Map<string, V> {
  constructor()
  constructor(map: Map<string, V>)
  constructor(map?: Map<string, V>) {
    super()
    const _map = new Map()
    if (map) {
      map.forEach((v, k) => {
        _map.set(this.makeKey(k), v)
      })
    }
    this.putAll(_map as CaseInsensitiveMap<V>)
  }

  override delete(key: string): boolean {
    return super.delete(this.makeKey(key))
  }

  override has(key: string): boolean {
    return super.has(this.makeKey(key))
  }

  override set(key: string, value: V): this {
    const _key = this.makeKey(key)
    // if (this.has(key)) {
    //   throw new Error(`Duplicate key: value for ${_key} already exists`);
    // }
    return super.set(_key, value)
  }

  override get(key: string): V | undefined {
    return super.get(this.makeKey(key))
  }

  // ALIASES

  put(key: string, value: V) {
    return this.set(key, value)
  }

  putAll(map: CaseInsensitiveMap<V>) {
    for (const [k, v] of map) {
      this.put(k, v)
    }
  }

  remove(key: string) {
    return this.delete(key)
  }

  getOrDefault(key: string, defaultValue: V) {
    if (this.has(key)) {
      return this.get(key)!
    }

    return defaultValue
  }

  contains(key: string) {
    return this.has(key)
  }

  private makeKey(key: string) {
    return key.toLowerCase()
  }
}
