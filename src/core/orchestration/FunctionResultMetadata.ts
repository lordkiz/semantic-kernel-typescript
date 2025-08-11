import CaseInsensitiveMap from "../ds/CaseInsensitiveMap"
import KernelArguments from "../functions/KernelArguments"

export default class FunctionResultMetadata<UsageType> {
  /**
   * The key for id metadata.
   */
  static ID: string = "id"
  /**
   * The key for usage metadata.
   */
  static USAGE: string = "usage"

  /**
   * The key for createdAt metadata.
   */
  static CREATED_AT = "createdAt"

  private _metadata: CaseInsensitiveMap<KernelArguments>

  constructor()
  constructor(metadata: CaseInsensitiveMap<KernelArguments>)
  constructor(metadata?: CaseInsensitiveMap<KernelArguments>) {
    this._metadata = new CaseInsensitiveMap(metadata!)
  }

  static build<UsageType>(id: string): FunctionResultMetadata<UsageType>
  static build<UsageType>(id: string, usage?: UsageType): FunctionResultMetadata<UsageType>
  static build<UsageType>(
    id: string,
    usage: UsageType,
    createdAt: number
  ): FunctionResultMetadata<UsageType>
  static build<UsageType>(
    id: string,
    usage?: UsageType,
    createdAt?: number
  ): FunctionResultMetadata<UsageType> {
    const metadata = new CaseInsensitiveMap<KernelArguments>()
    metadata.put(
      FunctionResultMetadata.ID,
      new KernelArguments().set(FunctionResultMetadata.ID, id)
    )
    if (usage) {
      metadata.put(
        FunctionResultMetadata.USAGE,
        new KernelArguments().set(FunctionResultMetadata.USAGE, usage)
      )
    }
    if (createdAt) {
      metadata.put(
        FunctionResultMetadata.CREATED_AT,
        new KernelArguments().set(FunctionResultMetadata.CREATED_AT, createdAt)
      )
    }

    return new FunctionResultMetadata<UsageType>(metadata)
  }

  /**
   * Create a new instance of FunctionResultMetadata with no metadata.
   *
   * @return A new instance of FunctionResultMetadata.
   */
  static empty<UsageType>(): FunctionResultMetadata<UsageType> {
    return new FunctionResultMetadata<UsageType>(new CaseInsensitiveMap())
  }

  /**
   * Get the metadata about the result of the function invocation.
   *
   * @return The metadata about the result of the function invocation.
   */
  get metadata() {
    return new CaseInsensitiveMap(this._metadata)
  }

  /**
   * Get the id of the result of the function invocation.
   *
   * @return The id of the result of the function invocation.
   */
  get id(): string | undefined {
    const id = this.metadata.getOrDefault(FunctionResultMetadata.ID, new KernelArguments())
    return id.get(FunctionResultMetadata.ID)?.value
  }

  /**
   * Get the usage of the result of the function invocation.
   *
   * @return The usage of the result of the function invocation.
   */
  getUsage(): UsageType | undefined {
    const usage = this.metadata.getOrDefault(FunctionResultMetadata.USAGE, new KernelArguments())
    return usage.get(FunctionResultMetadata.USAGE) as UsageType | undefined
  }

  /**
   * Get the time the result was created.
   *
   * @return The time the result was created.
   */
  getCreatedAt(): number | undefined {
    const date = this.metadata.getOrDefault(
      FunctionResultMetadata.CREATED_AT,
      new KernelArguments()
    )
    return date.get(FunctionResultMetadata.CREATED_AT) as number | undefined
  }
}
