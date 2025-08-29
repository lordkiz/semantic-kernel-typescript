import { FunctionResultMetadata } from "../orchestration/FunctionResultMetadata"
import { KernelContent } from "./types/KernelContent"

export abstract class KernelContentImpl<T> implements KernelContent<T> {
  /*
   * The inner content representation. Use this to bypass the current
   * abstraction. The usage of this property is considered "unsafe".
   * Use it only if strictly necessary.
   */
  private _innerContent: T | undefined

  /**
   * The model ID used to generate the content.
   */
  private _modelId: string | undefined

  /**
   * The metadata associated with the content.
   */
  private _metadata: FunctionResultMetadata<any> | undefined

  constructor()
  constructor(innerContent?: T, modelId?: string, metadata?: FunctionResultMetadata<any>)
  constructor(innerContent: T, modelId: string, metadata?: FunctionResultMetadata<any>)
  constructor(innerContent: T, modelId: string, metadata: FunctionResultMetadata<any>)
  /**
   * Initializes a new instance of the {@link KernelContentImpl} class.
   *
   * @param innerContent The inner content representation.
   * @param modelId      The model identifier used to generate the content.
   * @param metadata     The metadata associated with the content.
   */
  constructor(innerContent?: T, modelId?: string, metadata?: FunctionResultMetadata<any>) {
    this._innerContent = innerContent
    this._modelId = modelId
    this._metadata = metadata
  }

  get modelId() {
    return this._modelId
  }

  /**
   * Gets the inner content representation.
   *
   * @return The inner content representation.
   */
  get innerContent(): T | undefined {
    return this._innerContent
  }

  /**
   * Gets the metadata associated with the content.
   *
   * @return The metadata associated with the content.
   */
  getMetadata<UsageType>(): FunctionResultMetadata<UsageType> | undefined {
    return this._metadata
  }

  get content(): string | undefined {
    throw new Error("Implement in subclass")
  }
}
