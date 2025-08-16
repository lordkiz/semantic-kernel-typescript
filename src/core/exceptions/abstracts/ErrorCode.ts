export abstract class ErrorCode {
  code: string

  constructor(code: string) {
    this.code = code
  }

  get message(): string {
    return this.code
  }
}
