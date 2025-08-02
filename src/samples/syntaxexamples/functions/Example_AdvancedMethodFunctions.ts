import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelArguments } from "@semantic-kernel-typescript/core/functions"
import { DefineKernelFunction } from "@semantic-kernel-typescript/core/functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "@semantic-kernel-typescript/core/functions/decorators/KernelFunctionParameter"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import { map, Observable } from "rxjs"

class MyCustomType {
  number: number
  text: string

  constructor(i: number, text: string) {
    this.number = i
    this.text = text
  }
}

class FunctionsChainingPlugin {
  public static PluginName = "FunctionsChainingPlugin"

  @DefineKernelFunction({ name: "function1" })
  function1(@KernelFunctionParameter({ name: "kernel" }) kernel: Kernel): Observable<MyCustomType> {
    // Execute another function
    return kernel
      .invokeAsync<
        ReturnType<typeof this.function2>
      >({ pluginName: FunctionsChainingPlugin.PluginName, functionName: "function2" }, KernelArguments.Builder().build())
      .pipe(
        map(
          (value) =>
            new MyCustomType(
              2 * value.getResult().number,
              "From function1 + " + value.getResult().text
            )
        )
      )
  }

  @DefineKernelFunction({ name: "function2" })
  function2(): MyCustomType {
    return new MyCustomType(1, "From Function2")
  }
}

const main = async () => {
  console.log("Running Method Function Chaining example...")

  const functionsChainingPlugin = new FunctionsChainingPlugin()

  const plugin = KernelPluginFactory.createFromObject(
    functionsChainingPlugin,
    FunctionsChainingPlugin.PluginName
  )

  const kernel = Kernel.Builder().withPlugin(plugin).build()

  const result = await kernel.invoke<ReturnType<typeof functionsChainingPlugin.function1>>(
    {
      pluginName: FunctionsChainingPlugin.PluginName,
      functionName: "function1",
    },
    KernelArguments.Builder().withVariable("kernel", kernel).build()
  )

  result.getResult().subscribe({
    next(value) {
      console.log("CustomType.Number: " + value.number)

      console.log("CustomType.Text: " + value.text)
    },
  })
}

main()
