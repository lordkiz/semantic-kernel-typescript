import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelArguments } from "@semantic-kernel-typescript/core/functions"
import { DefineKernelFunction } from "@semantic-kernel-typescript/core/functions/decorators/DefineKernelFunction"
import { KernelFunctionParameter } from "@semantic-kernel-typescript/core/functions/decorators/KernelFunctionParameter"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import { lastValueFrom } from "rxjs"

class StaticTextPlugin {
  @DefineKernelFunction({
    description: "Change all string chars to uppercase.",
    name: "Uppercase",
    returnType: "java.lang.String",
  })
  uppercase(
    @KernelFunctionParameter({ description: "Text to uppercase", name: "text" }) text: string
  ) {
    return text.toUpperCase()
  }

  @DefineKernelFunction({
    description: "Append the day variable",
    name: "appendDay",
    returnType: "string",
  })
  appendDay(
    @KernelFunctionParameter({ description: "Text to append to", name: "input" }) input: string,
    @KernelFunctionParameter({ description: "Current day", name: "day" }) day: string
  ) {
    return input + day
  }
}

const main = async () => {
  const kernel = Kernel.Builder().build()

  // Load native plugin
  const kernelPlugin = KernelPluginFactory.createFromObject(new StaticTextPlugin(), "text")

  const kernelArguments = KernelArguments.Builder()
    .withInput("Today is: ")
    .withVariable("day", "Monday")
    .build()

  const kernelFunction = kernelPlugin.get("appendDay")

  if (!kernelFunction) {
    throw new Error("kernel function not found")
  }

  const functionResult = await lastValueFrom(kernel.invokeAsync(kernelFunction, kernelArguments))

  console.log(functionResult.getResult())
}

main()
