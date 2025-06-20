export default class ContextVariable<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }

  static of<T>(value: T): ContextVariable<T> {
    return new ContextVariable(value);
  }

  getRawValue() {
    return this.value;
  }

  getValue() {
    return this.resolveValue();
  }

  getType() {
    return typeof this.value;
  }

  private resolveValue(): T {
    // typeof
    switch (typeof this.value) {
      case "number":
      case "bigint":
        return Number(this.value) as T;
      case "boolean":
        return Boolean(this.value) as T;
      case "string":
        return new String(this.value).toString() as T;
      case "undefined":
        return this.value;
      default:
    }
    return this.value;
  }
}
