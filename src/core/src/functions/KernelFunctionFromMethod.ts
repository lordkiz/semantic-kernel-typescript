import { from, Observable } from "rxjs"
import SKException from "../exceptions/SKException"
import { FunctionInvokedEvent, FunctionInvokingEvent } from "../hooks/FnInvokeEvents"
import KernelHooks from "../hooks/KernelHooks"
import Kernel from "../Kernel"
import { Logger } from "../log/Logger"
import FunctionResult from "../orchestration/FunctionResult"
import InvocationContext from "../orchestration/InvocationContext"
import InputVariable from "./InputVariable"
import KernelArguments from "./KernelArguments"
import KernelFunction from "./KernelFunction"
import KernelFunctionMetadata from "./KernelFunctionMetadata"
import OutputVariable from "./OutputVariable"

/**
 * A {@link KernelFunction} that is created from a method. This class is used to create a
 * {@link KernelFunction} from a method that is annotated with {@link DefineKernelFunction} and
 * {@link KernelFunctionParameter}.
 *
 * @param <T> the return type of the function
 */
export default class KernelFunctionFromMethod<T> extends KernelFunction<T> {
  private LOGGER = Logger

  private constructor(
    method: Function,
    instance: InstanceType<any>,
    pluginName: string,
    description: string,
    parameters: InputVariable[],
    returnParameter: OutputVariable<T>
  ) {
    super(
      method,
      new KernelFunctionMetadata<T>(
        pluginName,
        method.name,
        description,
        parameters,
        returnParameter
      ),
      instance
    )
  }

  /**
   * Creates a new instance of {@link KernelFunctionFromMethod} from a method.
   *
   * @param method          the method to create the function from
   * @param target          the instance of the class that the method is a member of
   * @param pluginName      the name of the plugin which the function belongs to
   * @param description     the description of the function
   * @param parameters      the parameters of the function
   * @param returnParameter the return parameter of the function
   * @param <T>             the return type of the function
   * @return a new instance of {@link KernelFunctionFromMethod}
   */
  public static create<T>(
    method: Function,
    target: InstanceType<any>,
    pluginName?: string,
    description?: string,
    parameters?: InputVariable[],
    returnParameter?: OutputVariable<any>
  ): KernelFunction<T> {
    const _pluginName = pluginName || ""

    return new KernelFunctionFromMethod<T>(
      method,
      target,
      _pluginName,
      description ?? "",
      parameters ?? [],
      returnParameter ?? new OutputVariable()
    )
  }

  invokeAsync(
    kernel: Kernel,
    kernelArguments?: KernelArguments,
    invocationContext?: InvocationContext<any>
  ): Observable<FunctionResult<T>> {
    const context = invocationContext || InvocationContext.Builder().build()

    const kernelHooks = KernelHooks.merge(kernel.getGlobalKernelHooks(), context.getKernelHooks())

    const updatedState = kernelHooks.executeHooks(new FunctionInvokingEvent(this, kernelArguments))

    const updatedArguments =
      updatedState?.getArguments() ?? kernelArguments ?? new KernelArguments()

    const instance = this.getInstance()
    const fn = this.getMethod()

    const params: any[] = this.getMethodParams(updatedArguments)

    const resolveResult = async (): Promise<FunctionResult<T>> => {
      // call function
      const res: T = instance ? await instance[fn.name](...params) : await fn(...params)

      // execute FunctionInvokedHook
      const updatedResult = kernelHooks.executeHooks(
        new FunctionInvokedEvent(this, updatedArguments, new FunctionResult(res))
      )

      return updatedResult.getResult()
    }

    return from(resolveResult())
  }

  static Builder<T>(): KernelFunctionFromMethodBuilder<T> {
    return new KernelFunctionFromMethodBuilder()
  }
}

/**
 * A builder for {@link KernelFunction}.
 *
 * @param <T> the return type of the function
 */
class KernelFunctionFromMethodBuilder<T> {
  private method: Function | undefined

  private target: InstanceType<any> | undefined

  private pluginName: string | undefined

  private description: string | undefined

  private parameters: InputVariable[] | undefined

  private returnParameter: OutputVariable<T> | undefined

  /**
   * Sets the method to use to build the function.
   *
   * @param method the method to use
   * @return this instance of the {@link KernelFunctionFromMethodBuilder} class
   */
  public withMethod(method: Function): KernelFunctionFromMethodBuilder<T> {
    this.method = method
    return this
  }

  /**
   * Sets the target to use to build the function.
   *
   * @param target the target to use
   * @return this instance of the {@link KernelFunctionFromMethodBuilder} class
   */
  public withTarget(target?: InstanceType<any>): KernelFunctionFromMethodBuilder<T> {
    this.target = target
    return this
  }

  /**
   * Sets the plugin name to use to build the function.
   *
   * @param pluginName the plugin name to use
   * @return this instance of the {@link KernelFunctionFromMethodBuilder} class
   */
  public withPluginName(pluginName: string): KernelFunctionFromMethodBuilder<T> {
    this.pluginName = pluginName
    return this
  }

  /**
   * Sets the description to use to build the function.
   *
   * @param description the description to use
   * @return this instance of the {@link KernelFunctionFromMethodBuilder} class
   */
  public withDescription(description: string): KernelFunctionFromMethodBuilder<T> {
    this.description = description
    return this
  }

  /**
   * Sets the parameters to use to build the function.
   *
   * @param parameters the parameters to use
   * @return this instance of the {@link KernelFunctionFromMethodBuilder} class
   */
  public withParameters(parameters: InputVariable[]): KernelFunctionFromMethodBuilder<T> {
    this.parameters = Array.from(parameters)
    return this
  }

  /**
   * Sets the return parameter to use to build the function.
   *
   * @param returnParameter the return parameter to use
   * @return this instance of the {@link KernelFunctionFromMethodBuilder} class
   */
  public withReturnParameter(
    returnParameter: OutputVariable<T>
  ): KernelFunctionFromMethodBuilder<T> {
    this.returnParameter = returnParameter
    return this
  }

  /**
   * Builds a new instance of {@link KernelFunction}.
   *
   * @return a new instance of {@link KernelFunction}
   */
  build(): KernelFunction<T> {
    if (!this.method) {
      throw new SKException("To build a KernelFunctionFromMethod, a method must be provided")
    }

    // if (!this.target) {
    //   throw new SKException("To build a plugin object must be provided")
    // }

    return KernelFunctionFromMethod.create(
      this.method,
      this.target,
      this.pluginName,
      this.description,
      this.parameters,
      this.returnParameter
    )
  }
}
