import Kernel from "../../Kernel"
import KernelPluginFactory from "../../plugin/KernelPluginFactory"
import { DefineKernelFunction } from "../decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "../decorators/KernelFunctionParameter"
import KernelArguments from "../KernelArguments"

class ExamplePlugin {
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

describe("KernelFunctionFromMethod", () => {
  it("executes kernel function", async () => {
    const plugin = KernelPluginFactory.createFromObject(new ExamplePlugin(), "ExamplePlugin")
    const kernel = Kernel.Builder().build()

    const functionResult = await plugin
      .get("sqrt")
      ?.invoke(kernel, KernelArguments.Builder().withVariable("num", 12).build())

    expect(functionResult?.getResult()).toEqual(3.4641016151377544)
  })
})
