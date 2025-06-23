import FunctionResultMetadata from "../orchestration/FunctionResultMetadata";
import { KernelContent } from "./types/KernelContent";

export default abstract class KernelContentImpl<T> implements KernelContent<T> {
  /*
   * The inner content representation. Use this to bypass the current
   * abstraction. The usage of this property is considered "unsafe".
   * Use it only if strictly necessary.
   */
  private innerContent: T | undefined;

  /**
   * The model ID used to generate the content.
   */
  private modelId: string | undefined;

  /**
   * The metadata associated with the content.
   */
  private metadata: FunctionResultMetadata<any> | undefined;

  constructor();
  constructor(
    innerContent?: T,
    modelId?: string,
    metadata?: FunctionResultMetadata<any>
  );
  constructor(
    innerContent: T,
    modelId: string,
    metadata?: FunctionResultMetadata<any>
  );
  constructor(
    innerContent: T,
    modelId: string,
    metadata: FunctionResultMetadata<any>
  );
  /**
   * Initializes a new instance of the {@link KernelContentImpl} class.
   *
   * @param innerContent The inner content representation.
   * @param modelId      The model identifier used to generate the content.
   * @param metadata     The metadata associated with the content.
   */
  constructor(
    innerContent?: T,
    modelId?: string,
    metadata?: FunctionResultMetadata<any>
  ) {
    this.innerContent = innerContent;
    this.modelId = modelId;
    this.metadata = metadata;
  }

  getModelId() {
    return this.modelId;
  }

  /**
   * Gets the inner content representation.
   *
   * @return The inner content representation.
   */
  getInnerContent(): T | undefined {
    return this.innerContent;
  }

  /**
   * Gets the metadata associated with the content.
   *
   * @return The metadata associated with the content.
   */
  getMetadata<UsageType>(): FunctionResultMetadata<UsageType> | undefined {
    return this.metadata;
  }

  getContent(): string | undefined {
    return `${this.getInnerContent()}`;
  }
}
