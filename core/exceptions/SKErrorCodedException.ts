import { ErrorCode } from "./abstracts/ErrorCode"
import { SKException } from "./SKException"

export class SKErrorCodedException extends SKException {
  private _errorCode: ErrorCode
  constructor(errorCode: ErrorCode)
  constructor(errorCode: ErrorCode, message?: string)
  constructor(errorCode: ErrorCode, message: string, cause?: Error)
  constructor(errorCode: ErrorCode, message?: string, cause?: Error) {
    super(SKException.formatDefaultMessage(errorCode.message, message), cause)
    this._errorCode = errorCode
  }

  get errorCode(): ErrorCode {
    return this._errorCode
  }
}
