/**
 * Provides Http request settings for OpenAI requests.
 */
export class OpenAIRequestSettings {
  private static readonly SEMANTIC_KERNEL_VERSION_PROPERTY_NAME = "semantic-kernel.version"
  private static readonly SEMANTIC_KERNEL_VERSION_PROPERTIES_FILE =
    "semantic-kernel-version.properties"
  private static readonly SEMANTIC_KERNEL_DISABLE_USERAGENT_PROPERTY =
    "semantic-kernel.useragent-disable"

  private static readonly disabled: boolean = OpenAIRequestSettings.isDisabled()
  private static readonly version: string = OpenAIRequestSettings.loadVersion()
  private static readonly useragent: string = `semantic-kernel-typescript/${OpenAIRequestSettings.version}`
  private static readonly header: string = `typescript/${OpenAIRequestSettings.version}`

  private static isDisabled(): boolean {
    return (
      process.env[this.SEMANTIC_KERNEL_DISABLE_USERAGENT_PROPERTY]?.toLowerCase() === "true" ||
      false
    )
  }

  private static loadVersion(): string {
    const version = "unknown"

    try {
      // In Node.js environment, we would typically use require or fs to load properties
      // This is a simplified version - actual implementation may need to adjust based on your TS environment
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const props = require("../resources/" + this.SEMANTIC_KERNEL_VERSION_PROPERTIES_FILE)
      const skVersion = props[this.SEMANTIC_KERNEL_VERSION_PROPERTY_NAME]

      if (skVersion && skVersion.trim() !== "") {
        return skVersion
      }
    } catch (e) {
      // Ignore error - use default version
      console.trace("Failed to load Semantic Kernel version from properties file", e)
    }

    return version
  }

  /**
   * Get the HTTP request options for OpenAI requests.
   * @returns The request options
   */
  public static getRequestOptions(): RequestOptions {
    const requestOptions: RequestOptions = {}

    if (this.disabled) {
      return requestOptions
    }

    return {
      ...requestOptions,
      headers: {
        ...requestOptions.headers,
        "Semantic-Kernel-Version": this.header,
        "User-Agent": this.useragent,
      },
    }
  }
}

// Type definition for RequestOptions (simplified version)
interface RequestOptions {
  headers?: Record<string, string>
  // Add other request options properties as needed
}
