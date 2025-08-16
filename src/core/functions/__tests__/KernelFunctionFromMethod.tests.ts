import { PluginWithNameAndDescription } from "../../__tests__/mocks/pluginMocks"
import { Kernel } from "../../Kernel"
import { KernelPluginFactory } from "../../plugin/KernelPluginFactory"
import { KernelArguments } from "../KernelArguments"

describe("KernelFunctionFromMethod", () => {
  it("executes kernel function", async () => {
    const plugin = KernelPluginFactory.createFromObject(
      new PluginWithNameAndDescription(),
      "ExamplePlugin"
    )
    const kernel = Kernel.Builder().build()

    const functionResult = await plugin
      .get("sqrt")
      ?.invoke(kernel, KernelArguments.Builder().withVariable("num", 12).build())

    expect(functionResult?.result).toEqual(3.4641016151377544)
  })
})
