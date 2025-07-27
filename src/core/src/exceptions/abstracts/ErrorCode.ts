export abstract class ErrorCode {
  code: string;

  constructor(code: string) {
    this.code = code;
  }

  abstract getMessage(): string;
}
