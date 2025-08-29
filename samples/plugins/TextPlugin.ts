import {
  DefineKernelFunction,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"

/**
 * TextPlugin provides a set of functions to manipulate strings.
 */
export class TextPlugin {
  @DefineKernelFunction({ description: "Change all string chars to uppercase.", name: "uppercase" })
  uppercase(
    @KernelFunctionParameter({ description: "Text to uppercase", name: "input" }) text: string
  ) {
    return text.toUpperCase()
  }

  @DefineKernelFunction({ description: "Remove spaces to the left of a string.", name: "lStrip" })
  lStrip(@KernelFunctionParameter({ description: "Text to edit", name: "input" }) text: string) {
    return text.replaceAll("^ +", "")
  }

  @DefineKernelFunction({ description: "Remove spaces to the right of a string.", name: "rStrip" })
  rStrip(@KernelFunctionParameter({ description: "Text to edit", name: "input" }) text: string) {
    return text.replaceAll(" +$", "")
  }

  @DefineKernelFunction({
    description: "Remove spaces to the left and right of a string",
    name: "strip",
  })
  strip(@KernelFunctionParameter({ description: "Text to edit", name: "input" }) input: string) {
    return input.trim()
  }

  @DefineKernelFunction({ description: "Change all string chars to lowercase", name: "lowercase" })
  lowercase(
    @KernelFunctionParameter({ description: "Text to lowercase", name: "input" }) input: string
  ) {
    return input.toLowerCase()
  }

  /**
   * Concatenate two strings into one
   * @param input - First input to concatenate with
   * @param input2 - Second input to concatenate with
   * @returns string - Concatenation result from both inputs.
   */
  @DefineKernelFunction({ description: "Concat two strings into one.", name: "concat" })
  concat(
    @KernelFunctionParameter({ description: "First input to concatenate with", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Second input to concatenate with", name: "input2" })
    input2: string
  ) {
    return input + input2
  }
}
