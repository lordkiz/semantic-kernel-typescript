import { ErrorCode } from "./abstracts/ErrorCode";
import SKException from "./SKException";

class SKErrorCodedException<T extends ErrorCode> extends SKException {
  private errorCode: T;
  constructor(errorCode: T);
  constructor(errorCode: T, message?: string);
  constructor(errorCode: T, message?: string, cause?: Error) {
    super(
      SKException.formatDefaultMessage(errorCode.getMessage(), message),
      cause
    );
    this.errorCode = errorCode;
  }

  getErrorCode(): T {
    return this.errorCode;
  }
}

export default SKErrorCodedException;
