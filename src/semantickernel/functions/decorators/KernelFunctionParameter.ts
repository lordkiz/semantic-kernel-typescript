import SKException from "../../exceptions/SKException";
import {
  FunctionParameterType,
  KERNEL_FUNCTION_PARAMETER_METADATA_KEY,
} from "./constants";

export const NO_DEFAULT_VALUE = "SKFunctionParameters__NO_INPUT_PROVIDED";

export interface KernelFunctionParameterOptions {
  /**
   * The name of the parameter (required)
   */
  name: string;

  /**
   * The description of the parameter
   */
  description?: string;

  /**
   * The default value of the parameter
   */
  defaultValue?: string;

  /**
   * Whether a value is required for this argument
   */
  required?: boolean;

  /**
   * The type of the parameter (defaults to String)
   */
  type?: FunctionParameterType;
}

export interface KernelFunctionParameterMetadata {
  index: number;
  name: string;
  description?: string;
  defaultValue: string;
  required: boolean;
  type: any;
}

export function KernelFunctionParameter(
  opts: KernelFunctionParameterOptions
): ParameterDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) => {
    const key = propertyKey ?? "";
    if (!key) {
      throw new SKException(
        "Anonymous functions are not allowed as Kernel Functions"
      );
    }
    // Get existing parameters metadata or initialize empty array
    const existingParameters: KernelFunctionParameterMetadata[] =
      Reflect.getMetadata(
        KERNEL_FUNCTION_PARAMETER_METADATA_KEY,
        target,
        key
      ) || [];

    // Set default values for options
    const fullOptions = {
      defaultValue: NO_DEFAULT_VALUE,
      required: true,
      type: String,
      ...opts,
    };

    // Create parameter metadata
    const parameterMetadata: KernelFunctionParameterMetadata = {
      index: parameterIndex,
      ...fullOptions,
    };

    // Update parameters array
    existingParameters[parameterIndex] = parameterMetadata;

    // Store the metadata
    Reflect.defineMetadata(
      KERNEL_FUNCTION_PARAMETER_METADATA_KEY,
      existingParameters,
      target,
      key
    );
  };
}
