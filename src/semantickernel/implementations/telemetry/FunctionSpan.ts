import {
  trace,
  Span,
  SpanKind,
  SpanStatusCode,
  Context,
} from "@opentelemetry/api";
import SemanticKernelTelemetrySpan from "./SemanticKernelTelemetrySpan";
import SemanticKernelTelemetry from "./SemanticKernelTelemetry";
import KernelArguments from "../../functions/KernelArguments";
import FunctionResult from "../../orchestration/FunctionResult";

export default class FunctionSpan extends SemanticKernelTelemetrySpan {
  constructor(
    span: Span,
    reactorContextModifier: (ctx: any) => any,
    spanScope: { close: () => void },
    contextScope: { close: () => void }
  ) {
    super(span, reactorContextModifier, spanScope, contextScope);
  }

  public static build(
    telemetry: SemanticKernelTelemetry,
    contextView: any,
    pluginName: string,
    functionName: string,
    kernelArguments: KernelArguments
  ): FunctionSpan {
    const tracer = trace.getTracer("semantic-kernel");

    const span = tracer.startSpan(
      `function_invocation ${pluginName}-${functionName}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          "semantic_kernel.function.invocation.name": functionName,
          "semantic_kernel.function.invocation.plugin_name": pluginName,
          // Add any relevant arguments as attributes
          ...this.getArgumentAttributes(kernelArguments),
        },
      }
    );

    // Context handling - simplified for JS/TS
    const contextModifier = (ctx: any) => ({ ...ctx, span });
    const spanScope = { close: () => span.end() };
    const contextScope = { close: () => {} };

    return new FunctionSpan(span, contextModifier, spanScope, contextScope);
  }

  private static getArgumentAttributes(
    args: KernelArguments
  ): Record<string, any> {
    const attributes: Record<string, any> = {};

    // Convert arguments to span attributes
    // This is a simplified version - you might want to filter or format arguments differently
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        attributes[`semantic_kernel.function.argument.${key}`] =
          typeof value === "object" ? JSON.stringify(value) : value;
      }
    }

    return attributes;
  }

  public onFunctionSuccess<T>(result: FunctionResult<T>): void {
    try {
      this.getSpan().setStatus({ code: SpanStatusCode.OK });

      // Optionally add result metadata to span
      if (result.getMetadata()) {
        this.getSpan().setAttributes({
          "semantic_kernel.function.result.type": typeof result
            .getResultVariable()
            .getValue(),
          "semantic_kernel.function.result.success": true,
          ...this.getResultMetadataAttributes(result.getMetadata()),
        });
      }
    } finally {
      this.close();
    }
  }

  public onFunctionError(error: Error): void {
    try {
      this.getSpan().setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      this.getSpan().recordException(error);

      // Add error metadata
      this.getSpan().setAttributes({
        "semantic_kernel.function.error": true,
        "semantic_kernel.function.error.type": error.name,
        "semantic_kernel.function.error.stack": error.stack,
      });
    } finally {
      this.close();
    }
  }

  private getResultMetadataAttributes(metadata: any): Record<string, any> {
    const attributes: Record<string, any> = {};

    // Convert metadata to span attributes
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        attributes[`semantic_kernel.function.metadata.${key}`] =
          typeof value === "object" ? JSON.stringify(value) : value;
      }
    }

    return attributes;
  }
}
