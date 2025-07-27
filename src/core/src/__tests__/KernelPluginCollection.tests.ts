import SKException from "../exceptions/SKException"
import KernelPluginCollection from "../KernelPluginCollection"
import KernelPluginFactory from "../plugin/KernelPluginFactory"
import { PluginWithNameAndDescription, PluginWithNonKernelMethod } from "./mocks/pluginMocks"

describe("KernelPluginCollection", () => {
  const plugin1 = KernelPluginFactory.createFromObject(
    new PluginWithNameAndDescription(),
    "ExamplePlugin"
  )
  const plugin2 = KernelPluginFactory.createFromObject(
    new PluginWithNonKernelMethod(),
    "ExamplePlugin2"
  )

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
