import _ from "lodash"
import { lastValueFrom, Observable } from "rxjs"
import SKException from "../exceptions/SKException"
import Kernel from "../Kernel"
import ExecutionSettingsForService from "../orchestration/ExecutionSettingsForService"
import FunctionResult from "../orchestration/FunctionResult"
import InvocationContext from "../orchestration/InvocationContext"
import ContextVariable from "../variables/ContextVariable"
import { KERNEL_FUNCTION_PARAMETER_METADATA_KEY } from "./decorators/constants"
import {
  KernelFunctionParameterMetadata,
  NO_DEFAULT_VALUE,
} from "./decorators/KernelFunctionParameter"
import KernelArguments from "./KernelArguments"
import KernelFunctionMetadata from "./KernelFunctionMetadata"

export default abstract class KernelFunction<T> {
  private method: Function
  private readonly instance: InstanceType<any> | undefined
  private metadata: KernelFunctionMetadata<T>
  private executionSettings: ExecutionSettingsForService | undefined

  constructor(
    method: Function,
    metadata: KernelFunctionMetadata<T>,
    instance?: InstanceType<any>,
    executionSettings?: ExecutionSettingsForService
  ) {
    if (!method.name) {
      throw new SKException("Anonymous functions are not valid as Kernel Functions")
    }

    this.method = method
    this.metadata = metadata
    this.executionSettings = executionSettings ?? ExecutionSettingsForService.create()

    this.instance = instance
  }

  /**
   * Get the plugin name of the function.
   * @return The name of the plugin that this function is within
   */
  public getPluginName() {
    return this.metadata.getPluginName()
  }

  /**
   * Get the name of the function.
   * @return The name of this function
   */
  public getName() {
    return this.metadata.getName()
  }

  /**
   * Get the description of the function.
   * @return A description of the function
   */
  public getDescription() {
    return this.metadata.getDescription()
  }

  /**
   * Get the instance that the method of this Kernel Function is defined on.
   * Note: Multiple Kernel Functions can reference the same instance
   * @returns A Proxy of the original instance
   */
  getInstance(): InstanceType<any> | undefined {
    if (this.instance) {
      return new Proxy<InstanceType<any>>(_.cloneDeep(this.instance), {
        apply(target, _thisArg, argumentsList) {
          return new target(...argumentsList)
        },
      })
    }
  }

  getMethod() {
    return this.method
  }

  /**
   * Get an unmodifiable map of the execution settings for the function.
   *
   * @return An unmodifiable map of the execution settings for the function
   */
  public getExecutionSettings() {
    return Object.seal(this.executionSettings)
  }

  /**
   * Get the metadata for the function.
   *
   * @return The metadata for the function
   */
  public getMetadata() {
    return this.metadata
  }

  getMethodParams(kernelArguments: KernelArguments): any[] {
    const methodParams: KernelFunctionParameterMetadata[] =
      Reflect.getMetadata(
        KERNEL_FUNCTION_PARAMETER_METADATA_KEY,
        this.getInstance(),
        this.getMethod().name
      ) ?? []

    return methodParams
      .sort((a, b) => a.index - b.index)
      .map((p) => {
        const value =
          kernelArguments?.get(p.name) ??
          (p.defaultValue !== NO_DEFAULT_VALUE
            ? ContextVariable.of<typeof p.type>(p.defaultValue)
            : undefined)

        const v = value ? value.getValue() : value
        if (p.required && v === undefined) {
          throw new SKException(`no value provided for required parameter ${p.name}`)
        }
        return v
      })
  }

  /**
   * Invokes this KernelFunction.
   *
   * @param kernel The Kernel containing services, plugins, and other state for use throughout the
   *               operation.
   * @return The result of the function's execution.
   */
  // abstract invokeAsync(kernel: Kernel) {
  //   return new FunctionInvocation(kernel, this);
  // }

  /**
   * Invokes this KernelFunction.
   * <p>
   * If the {@code variableType} parameter is provided, the {@link ContextVariableType} is used to
   * convert the result of the function to the appropriate {@link FunctionResult}. The
   * {@code variableType} is not required for converting well-known types such as {@link String}
   * and {@link Integer} which have pre-defined {@code ContextVariableType}s.
   * <p>
   * The {@link InvocationContext} allows for customization of the behavior of function, including
   * the ability to pass in {@link KernelHooks} {@link ExecutionSettingsForService}, and
   * {@link ToolCallBehavior}.
   * <p>
   * The difference between calling the {@code KernelFunction.invokeAsync} method directly and
   * calling the {@code Kernel.invokeAsync} method is that the latter adds the global KernelHooks
   * (if any) to the {@link InvocationContext}. Calling {@code KernelFunction.invokeAsync}
   * directly does not add the global hooks.
   *
   * @param kernel            The Kernel containing services, plugins, and other state for use
   *                          throughout the operation.
   * @param arguments         The arguments to pass to the function's invocation
   * @param variableType      The type of the {@link ContextVariable} returned in the
   *                          {@link FunctionResult}
   * @param invocationContext The arguments to pass to the function's invocation
   * @return The result of the function's execution.
   * @see FunctionResult#getResultVariable()
   */
  abstract invokeAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): Observable<FunctionResult<T>>

  async invoke(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext
  ): Promise<FunctionResult<T>> {
    const functionResult = lastValueFrom(
      this.invokeAsync(kernel, kernelArguments, invocationContext)
    )

    return functionResult
  }
}
