import SKException from "./exceptions/SKException"
import { DefineKernelFunction } from "./functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "./functions/decorators/KernelFunctionParameter"
import KernelPluginCollection from "./KernelPluginCollection"
import KernelPluginFactory from "./plugin/KernelPluginFactory"

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

  nonKernelFunction() {
    return "I am not a kernel function"
  }
}

describe("KernelPluginCollection", () => {
  const plugin1 = KernelPluginFactory.createFromObject(new ExamplePlugin(), "ExamplePlugin")
  const plugin2 = KernelPluginFactory.createFromObject(new ExamplePlugin2(), "ExamplePlugin2")

  it("is able to find all functions", () => {
    const kernelPluginCollection = new KernelPluginCollection([plugin1, plugin2])
    expect(kernelPluginCollection.getFunctions().length).toEqual(2)
    expect(kernelPluginCollection.getFunctions().map((k) => k.getName())).toEqual([
      "sqrt",
      "square",
    ])
  })

  it("can add plugin", async () => {
    const kernelPluginCollection = new KernelPluginCollection([plugin1])
    expect(kernelPluginCollection.getFunctions().map((k) => k.getName())).toEqual(["sqrt"])

    kernelPluginCollection.add(plugin2)
    expect(kernelPluginCollection.getFunctions().map((k) => k.getName())).toEqual([
      "sqrt",
      "square",
    ])
  })

  it("can find a function associated with a plugin", () => {
    const kernelPluginCollection = new KernelPluginCollection([plugin1, plugin2])
    expect(kernelPluginCollection.getFunction("ExamplePlugin", "sqrt").getName()).toEqual("sqrt")
    expect(kernelPluginCollection.getFunction("ExamplePlugin2", "square").getName()).toEqual(
      "square"
    )

    expect(() => kernelPluginCollection.getFunction("ExamplePlugin", "square")).toThrow(SKException)
    expect(() => kernelPluginCollection.getFunction("NotAPlugin", "sqrt")).toThrow(SKException)
  })
})
