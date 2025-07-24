import { clamp } from "../utils/clamp"

export default class PromptExecutionSettings<
  /** Specifies the type of settings.
   * Example, OpenAI's Settings type would be ChatCompletionCreateParams.
   * Gemini's would be GenerateContentConfig */
  SettingsType extends Record<string, unknown> = Record<string, any>,
> extends Map<keyof SettingsType, any> {
  private settings: SettingsType
  constructor(settings: SettingsType, serviceId?: string, resultsPerPrompt?: number) {
    super()

    this.settings = settings

    this.set(
      "serviceId",
      this.get("serviceId") ?? serviceId ?? PromptExecutionSettings.DEFAULT_SERVICE_ID
    )
    this.set(
      "resultsPerPrompt",
      this.get("resultsPerPrompt") ??
        clamp(
          resultsPerPrompt ?? PromptExecutionSettings.DEFAULT_RESULTS_PER_PROMPT,
          1,
          Number.MAX_VALUE
        )
    )

    for (const key of Object.keys(settings ?? {})) {
      this.set(key, settings[key])
    }
  }

  static DEFAULT_RESULTS_PER_PROMPT = 1

  get serviceId(): string {
    return this.get("serviceId") ?? PromptExecutionSettings.DEFAULT_SERVICE_ID
  }

  get resultsPerPrompt(): number {
    return this.get("resultsPerPrompt") ?? PromptExecutionSettings.DEFAULT_RESULTS_PER_PROMPT
  }

  toObject(): SettingsType {
    return Object.assign(this.settings)
  }

  /**
   * The default for ServiceID. Defaults to "default"
   */
  static DEFAULT_SERVICE_ID = "default"

  static Builder<SettingsType>() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return new PromptExecutionSettingsBuilder<SettingsType>()
  }
}

////
////
////
////
////
// BUILDER

class BaseBuilder<R extends Record<string, unknown>> {
  private settings: R = {} as R
  set<K extends keyof R>(k: K, param: R[K]) {
    ;(this.settings as Record<string, unknown>)[k as string] = param
    return this
  }

  build(): PromptExecutionSettings<R> {
    return new PromptExecutionSettings(this.settings)
  }
}

type BuilderClazzType<R extends Record<string, unknown>> = BaseBuilder<R> & {
  [K in keyof R]-?: (param: R[K]) => BuilderClazzType<R>
}

const PromptExecutionSettingsBuilder = class PromptExecutionSettingsBuilder {
  constructor() {
    return new Proxy(new BaseBuilder(), {
      get(t, k, r) {
        return typeof k === "string" && !(k in t)
          ? (param: any) => t.set(k, param)
          : Reflect.get(t, k, r)
      },
    })
  }
} as new <R extends Record<string, unknown>>() => BuilderClazzType<R>
