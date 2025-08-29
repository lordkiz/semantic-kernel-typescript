import {
  KERNEL_FUNCTION_METADATA_KEY,
  KERNEL_FUNCTION_PARAMETER_METADATA_KEY,
} from "../functions/decorators/constants"
import { KernelFunctionParameterMetadata } from "../functions/decorators/KernelFunctionParameter"
import { InputVariable } from "../functions/InputVariable"
import { KernelFunctionFactory } from "../functions/KernelFunctionFactory"
import { KernelFunctionFromMethod } from "../functions/KernelFunctionFromMethod"

export class ClassUtils {
  static getKernelFunctionBuildersFromInstance(instance: InstanceType<any>) {
    const prototype = Object.getPrototypeOf(instance)
    // Get all property keys
    const propertyKeys = Object.getOwnPropertyNames(prototype).concat(
      Object.getOwnPropertyNames(instance)
    )

    const kernelFunctionBuilders: ReturnType<typeof KernelFunctionFromMethod.Builder>[] = []

    for (const propertyKey of propertyKeys) {
      // Skip constructor and non-properties
      if (propertyKey === "constructor") continue
      // Get metadata for this property
      const meta = Reflect.getMetadata(KERNEL_FUNCTION_METADATA_KEY, prototype, propertyKey)

      if (meta) {
        const method = (instance as any)[propertyKey]
        let kernelFunctionBuilder = KernelFunctionFactory.createFromMethod(
          method,
          instance
        ).withDescription(meta.description ?? "")

        const methodParams: KernelFunctionParameterMetadata[] = (
          (Reflect.getMetadata(KERNEL_FUNCTION_PARAMETER_METADATA_KEY, instance, method.name) ??
            []) as KernelFunctionParameterMetadata[]
        ).sort((a, b) => a.index - b.index)

        kernelFunctionBuilder = kernelFunctionBuilder.withParameters(
          methodParams.map((p) => InputVariable.fromKernelFunctionParameterMetadata(p))
        )

        kernelFunctionBuilders.push(kernelFunctionBuilder)
      }
    }

    return kernelFunctionBuilders
  }
}
