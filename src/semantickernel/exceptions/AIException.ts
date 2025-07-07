import { ErrorCode } from "./abstracts/ErrorCode"
import SKErrorCodedException from "./SKErrorCodedException"

enum AIErrorCodeEnum {
  "UNKNOWN_ERROR" = "UNKNOWN_ERROR",
  "NO_RESPONSE" = "NO_RESPONSE",
  "ACCESS_DENIED" = "ACCESS_DENIED",
  "INVALID_REQUEST" = "INVALID_REQUEST",
  "INVALID_RESPONSE_CONTENT" = "INVALID_RESPONSE_CONTENT",
  "THROTTLING" = "THROTTLING",
  "REQUEST_TIMEOUT" = "REQUEST_TIMEOUT",
  "SERVICE_ERROR" = "SERVICE_ERROR",
  "MODEL_NOT_AVAILABLE" = "MODEL_NOT_AVAILABLE",
  "INVALID_CONFIGURATION" = "INVALID_CONFIGURATION",
  "FUNCTION_TYPE_NOT_SUPPORTED" = "FUNCTION_TYPE_NOT_SUPPORTED",
}

const aiCodeToMessageMap: Record<AIErrorCodeEnum, string> = {
  UNKNOWN_ERROR: "unknown error",
  NO_RESPONSE: "no response",
  ACCESS_DENIED: "access is denied",
  INVALID_REQUEST: "the request was invalid",
  INVALID_RESPONSE_CONTENT: "the content of the response was invalid",
  THROTTLING: "the request was throttled",
  REQUEST_TIMEOUT: "the request timed out",
  SERVICE_ERROR: "there was an error in the service",
  MODEL_NOT_AVAILABLE: "the request model is not available",
  INVALID_CONFIGURATION: "the supplied configuration was invalid",
  FUNCTION_TYPE_NOT_SUPPORTED: "the function is not supported",
}

export class AIErrorCode implements ErrorCode {
  code: AIErrorCodeEnum

  constructor(code: AIErrorCodeEnum) {
    this.code = code
  }

  static CODE = AIErrorCodeEnum

  getMessage() {
    return aiCodeToMessageMap[this.code]
  }
}

class AIException extends SKErrorCodedException<AIErrorCode> {}

export default AIException
