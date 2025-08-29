import { DefineKernelFunction } from "../../functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "../../functions/decorators/KernelFunctionParameter"

export class PluginWithNameAndDescription {
  @DefineKernelFunction({ name: "sqrt", description: "Take the square root of a number" })
  sqrt(
    @KernelFunctionParameter({
      name: "num",
      description: "The number to take a square root of",
      type: "number",
    })
    num: number
  ): number {
    return Math.sqrt(num)
  }
}

export class PluginWithNonKernelMethod {
  @DefineKernelFunction({ name: "square", description: "Square a number" })
  square(
    @KernelFunctionParameter({
      name: "num",
      description: "The number to square",
      type: "number",
    })
    num: number
  ): number {
    return num * num
  }

  nonKernelFunction() {
    return "I am not a kernel function"
  }
}
