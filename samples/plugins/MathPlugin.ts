import {
  DefineKernelFunction,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"

export class MathPlugin {
  @DefineKernelFunction({ name: "sqrt", description: "Take the square root of a number" })
  public sqrt(
    @KernelFunctionParameter({
      name: "number1",
      description: "The number to take a square root of",
    })
    number1: number
  ) {
    return Math.sqrt(number1)
  }
  @DefineKernelFunction({ name: "add", description: "Add two numbers" })
  add(
    @KernelFunctionParameter({ name: "number1", description: "The first number to add" })
    number1: number,
    @KernelFunctionParameter({ name: "number2", description: "The second number to add" })
    number2: number
  ) {
    return number1 + number2
  }

  @DefineKernelFunction({ name: "subtract", description: "Subtract two numbers" })
  subtract(
    @KernelFunctionParameter({ name: "number1", description: "The first number to subtract from" })
    number1: number,
    @KernelFunctionParameter({ name: "number2", description: "The second number to subtract away" })
    number2: number
  ) {
    return number1 - number2
  }

  @DefineKernelFunction({
    name: "multiply",
    description:
      "Multiply two numbers. When increasing by a percentage, don't forget to add 1 to the percentage.",
  })
  multiply(
    @KernelFunctionParameter({ name: "number1", description: "The first number to multiply" })
    number1: number,
    @KernelFunctionParameter({ name: "number2", description: "The second number to multiply" })
    number2: number
  ) {
    return number1 * number2
  }

  @DefineKernelFunction({ name: "divide", description: "Divide two numbers" })
  divide(
    @KernelFunctionParameter({ name: "number1", description: "The first number to divide from" })
    number1: number,
    @KernelFunctionParameter({ name: "number2", description: "The second number to divide by" })
    number2: number
  ) {
    return number1 / number2
  }

  @DefineKernelFunction({ name: "power", description: "Raise a number to a power" })
  power(
    @KernelFunctionParameter({ name: "number1", description: "The number to raise" })
    number1: number,
    @KernelFunctionParameter({ name: "number2", description: "The power to raise the number to" })
    number2: number
  ) {
    return Math.pow(number1, number2)
  }

  @DefineKernelFunction({ name: "log", description: "Take the log of a number" })
  log(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the log of" })
    number1: number,
    @KernelFunctionParameter({ name: "number2", description: "The base of the log" })
    number2: number
  ) {
    return Math.log(number1) / Math.log(number2)
  }

  @DefineKernelFunction({
    name: "round",
    description: "Round a number to the target number of decimal places",
  })
  round(
    @KernelFunctionParameter({ name: "number1", description: "The number to round" })
    number1: number,
    @KernelFunctionParameter({
      name: "number2",
      description: "The number of decimal places to round to",
    })
    number2: number
  ) {
    return Math.round(number1 * Math.pow(10, number2)) / Math.pow(10, number2)
  }

  @DefineKernelFunction({ name: "abs", description: "Take the absolute value of a number" })
  abs(
    @KernelFunctionParameter({
      name: "number1",
      description: "The number to take the absolute value of",
    })
    number1: number
  ) {
    return Math.abs(number1)
  }

  @DefineKernelFunction({ name: "floor", description: "Take the floor of a number" })
  floor(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the floor of" })
    number1: number
  ) {
    return Math.floor(number1)
  }

  @DefineKernelFunction({ name: "ceiling", description: "Take the ceiling of a number" })
  ceiling(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the ceiling of" })
    number1: number
  ) {
    return Math.ceil(number1)
  }

  @DefineKernelFunction({ name: "sin", description: "Take the sine of a number" })
  sin(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the sine of" })
    number1: number
  ) {
    return Math.sin(number1)
  }

  @DefineKernelFunction({ name: "cos", description: "Take the cosine of a number" })
  cos(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the cosine of" })
    number1: number
  ) {
    return Math.cos(number1)
  }

  @DefineKernelFunction({ name: "tan", description: "Take the tangent of a number" })
  tan(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the tangent of" })
    number1: number
  ) {
    return Math.tan(number1)
  }

  @DefineKernelFunction({ name: "asin", description: "Take the arcsine of a number" })
  asin(
    @KernelFunctionParameter({ name: "number1", description: "The number to take the arcsine of" })
    number1: number
  ) {
    return Math.asin(number1)
  }

  @DefineKernelFunction({ name: "acos", description: "Take the arccosine of a number" })
  acos(
    @KernelFunctionParameter({
      name: "number1",
      description: "The number to take the arccosine of",
    })
    number1: number
  ) {
    return Math.acos(number1)
  }

  @DefineKernelFunction({ name: "atan", description: "Take the arctangent of a number" })
  atan(
    @KernelFunctionParameter({
      name: "number1",
      description: "The number to take the arctangent of",
    })
    number1: number
  ) {
    return Math.atan(number1)
  }
}
