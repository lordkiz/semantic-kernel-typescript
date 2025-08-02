import "reflect-metadata"
import SKException from "../../exceptions/SKException"
import { KERNEL_FUNCTION_METADATA_KEY, SKSample } from "./constants"

export type DefineKernelFunctionOptions = Partial<{
  /**
   * The description of what the function does. The description should be short and concise. The
   * model uses the description to determine whether the function is a good match for use to
   * complete a prompt. If the model is not selecting a function when it should be, consider
   * adding more detail to the description.
   *
   * @return the description of the function, or an empty string if no description is provided.
   */
  description?: string

  /**
   * The name of the function.
   *
   * @return the name of the function, or an empty string if no name is provided.
   */
  name?: string

  /**
   * The fully qualified class name of the return value of the function, for example,
   * "java.lang.String". If this parameter is not provided, the model will attempt to infer the
   * return type from the method signature. For async methods provide the return from the async
   * method, i.e. if the method returns a Mono&lt;String&gt; then the returnType should be "java.lang.String".
   *
   * @return the fully qualified class name of the return value of the function
   */
  returnType?: string

  /**
   * The description of the return value of the function. The description should be short and
   * concise.
   *
   * @return the description of the return value of the function, or an empty string if no
   * description is provided.
   */
  returnDescription?: string

  /**
   * Examples of how to use the function. The examples should be short and concise. The Semantic
   * Kernel can use the examples to help the model understand how the function is used.
   *
   * @return Examples of how to use the function, or an empty array if no examples are provided.
   */
  samples?: SKSample[]
}>

export function DefineKernelFunction(options?: DefineKernelFunctionOptions) {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const opts: DefineKernelFunctionOptions = options ?? { name: String(propertyKey).toString() }

    if (!propertyKey) {
      throw new SKException("Anonymous functions are not allowed as Kernel Functions")
    }

    if (opts.name !== String(propertyKey).toString()) {
      throw new SKException(
        `Kernel function ${opts.name} does not match method name ${String(propertyKey).toString()}`
      )
    }

    Reflect.defineMetadata(KERNEL_FUNCTION_METADATA_KEY, opts, target, propertyKey)

    // const originalMethod = descriptor.value;

    // descriptor.value = function (...args: any[]) {
    //   // Add any kernel-specific preprocessing here
    //   const result = originalMethod.apply(this, args);
    //   // Add any kernel-specific postprocessing here
    //   return result;
    // };

    return descriptor
  }
}
