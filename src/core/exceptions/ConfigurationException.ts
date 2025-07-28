import SKErrorCodedException from "./SKErrorCodedException";

enum ConfigurationErrorCodeEnum {
  "UNKNOWN_ERROR" = "UNKNOWN_ERROR",
  "CONFIGURATION_NOT_FOUND" = "CONFIGURATION_NOT_FOUND",
  "COULD_NOT_READ_CONFIGURATION" = "COULD_NOT_READ_CONFIGURATION",
  "NO_VALID_CONFIGURATIONS_FOUND" = "NO_VALID_CONFIGURATIONS_FOUND",
  "VALUE_NOT_FOUND" = "VALUE_NOT_FOUND",
}

const configurationCodeToMessageMap: Record<
  ConfigurationErrorCodeEnum,
  string
> = {
  CONFIGURATION_NOT_FOUND: "could not find configuration file",
  COULD_NOT_READ_CONFIGURATION: "could not parse or load configuration file",
  NO_VALID_CONFIGURATIONS_FOUND:
    "could not find any valid configuration settings",
  UNKNOWN_ERROR: "unknown error",
  VALUE_NOT_FOUND: "could not find value for configuration key",
};

export class ConfigurationErrorCode {
  code: ConfigurationErrorCodeEnum;

  constructor(code: ConfigurationErrorCodeEnum) {
    this.code = code;
  }

  getMessage() {
    return configurationCodeToMessageMap[this.code];
  }
}

class ConfigurationException extends SKErrorCodedException<ConfigurationErrorCode> {}

export default ConfigurationException;
