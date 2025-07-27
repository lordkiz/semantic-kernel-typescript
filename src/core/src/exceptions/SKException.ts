class SKException extends Error {
  constructor();
  constructor(message?: string);
  constructor(message?: string, cause?: Error);
  constructor(message: string, cause?: Error);
  constructor(message?: string, cause?: Error) {
    super(message, { cause });
  }

  /**
   * Forms an unchecked exception, if the exception is already an SK exception, it will be
   * unwrapped and the cause extracted.
   *
   * @param message The message to be displayed
   * @param cause   The exception that is the cause of the current exception.
   * @return An unchecked exception
   */
  static build(message: string, cause?: Error) {
    return new SKException(message, cause);
  }

  /**
   * Translate the error code into a default message format.
   *
   * @param errorMessage The error message from an error code
   * @param message      The message from the code which throws the exception
   * @return A formatted message
   */
  static formatDefaultMessage(
    errorMessage: string,
    message: string | undefined
  ) {
    return `${errorMessage}: ${message}`;
  }
}

export default SKException;
