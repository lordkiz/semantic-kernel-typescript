import { SKException } from "./SKException"

/**
 * Exception thrown when a service is not found.
 */
export class ServiceNotFoundException extends SKException {
  /**
   * Initializes a new instance of the {@link ServiceNotFoundException} class.
   *
   * @param s A message which describes the service that could not be found.
   */
  constructor(s: string) {
    super(s)
  }
}
