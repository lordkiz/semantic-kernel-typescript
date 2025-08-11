import { DefineKernelFunction } from "../../functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "../../functions/decorators/KernelFunctionParameter"
import KernelArguments from "../../functions/KernelArguments"
import KernelFunctionFactory from "../../functions/KernelFunctionFactory"
import Kernel from "../../Kernel"
import KernelPluginFactory from "../KernelPluginFactory"

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

class ExamplePlugin2 {
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
}

describe("KernelPlugin", () => {
  it("is able to find and execute functions", async () => {
    const plugin = KernelPluginFactory.createFromObject(new ExamplePlugin(), "ExamplePlugin")
    const kernel = Kernel.Builder().build()

    const functionResult = await plugin
      .get("sqrt")
      ?.invoke(kernel, KernelArguments.Builder().withVariable("num", 12).build())

    expect(functionResult?.result).toEqual(3.4641016151377544)
  })

  it("can add, find and execute new funtions", async () => {
    const plugin = KernelPluginFactory.createFromObject(new ExamplePlugin(), "ExamplePlugin")
    const kernel = Kernel.Builder().build()

    // add new kernel function
    const newTarget = new ExamplePlugin2()
    plugin.addFunction(KernelFunctionFactory.createFromMethod(newTarget.square, newTarget).build())

    const functionResult = await plugin
      .get("sqrt")
      ?.invoke(kernel, KernelArguments.Builder().withVariable("num", 12).build())

    expect(functionResult?.result).toEqual(3.4641016151377544)

    const functionResult2 = await plugin
      .get("square")
      ?.invoke(kernel, KernelArguments.Builder().withVariable("num", 12).build())

    expect(functionResult2?.result).toEqual(144)
  })
})
