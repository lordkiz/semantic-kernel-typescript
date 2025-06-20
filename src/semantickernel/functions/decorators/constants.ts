/**
 * Interface for function usage examples
 */
export interface SKSample {
  /** Input example */
  input: string;
  /** Description of what the example demonstrates */
  description: string;
}

export const KERNEL_FUNCTION_METADATA_KEY = "sk:function";

export const KERNEL_FUNCTION_PARAMETER_METADATA_KEY = "sk:function:parameters";

export type FunctionParameterType = String | Number | Boolean | Object;
