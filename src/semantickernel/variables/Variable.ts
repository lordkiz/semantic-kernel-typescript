export default class Variable<T> {
  private value: T;
  constructor(value: T) {
    this.value = value;
  }

  static of<T>(value: T): Variable<T> {
    return new Variable(value);
  }

  getValue() {
    return this.value;
  }

  getType() {
    return typeof this.value;
  }
}
