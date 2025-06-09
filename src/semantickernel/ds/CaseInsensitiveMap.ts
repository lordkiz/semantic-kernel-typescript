import { IDTagged } from "./IDTagged";

class CaseInsensitiveMap<V extends IDTagged> {
  private argSet: Record<string, V> = {};

  private _add(key: string, value: V): [string, V] {
    const _key = key.toLowerCase();
    if (this.contains(_key)) {
      throw new Error(`Duplicate key: value for ${_key} already exists`);
    }
    this.argSet[_key] = value;
    return [_key, value];
  }

  private _remove(key: string): boolean {
    const _key = key.toLowerCase();
    if (this.contains(_key)) {
      delete this.argSet[_key];
      return true;
    }
    return false;
  }

  put(value: V): ReturnType<typeof this._add> {
    return this._add(value.getID(), value);
  }

  putForKey(key: string, value: V): ReturnType<typeof this._add> {
    return this._add(key, value);
  }

  remove(value: V): boolean;
  remove(key: string): boolean;
  remove(kOrV: string | V): boolean {
    if (typeof kOrV === "string") {
      return this._remove(kOrV);
    }
    return this._remove(kOrV.getID());
  }

  contains(key: string) {
    return !!this.argSet[key.toLowerCase()];
  }
}

export default CaseInsensitiveMap;
