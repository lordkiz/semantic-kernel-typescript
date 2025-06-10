import { JsonCreator } from "../decorators/JsonCreator";
import { JsonProperty } from "../decorators/JsonProperty";
import { clamp } from "../utils/clamp";
import ResponseFormat from "./responseformat/ResponseFormat";

@JsonCreator()
class PromptExecutionSettings {
  /**
   * The default for ServiceID. Defaults to "default"
   */
  static DEFAULT_SERVICE_ID = "default";

  static DEFAULT_MAX_TOKENS = 256;

  static DEFAULT_TEMPERATURE = 1.0;

  static DEFAULT_TOP_P = 1.0;

  static DEFAULT_PRESENCE_PENALTY = 0.0;

  static DEFAULT_FREQUENCY_PENALTY = 0.0;

  static DEFAULT_BEST_OF = 1;

  static DEFAULT_RESULTS_PER_PROMPT = 1;

  //
  // Keys used as both @JsonProperty names and keys to the Builder's value map.
  //
  private static SERVICE_ID_JSON_FIELD = "service_id";
  private static MODEL_ID_JSON_FIELD = "model_id";
  private static TEMPERATURE_JSON_FIELD = "temperature";
  private static TOP_P_JSON_FIELD = "top_p";
  private static PRESENCE_PENALTY_JSON_FIELD = "presence_penalty";
  private static FREQUENCY_PENALTY_JSON_FIELD = "frequency_penalty";
  private static MAX_TOKENS_JSON_FIELD = "max_tokens";
  private static BEST_OF_JSON_FIELD = "best_of";
  private static USER_JSON_FIELD = "user";
  private static STOP_SEQUENCES_JSON_FIELD = "stop_sequences";
  private static RESULTS_PER_PROMPT_JSON_FIELD = "results_per_prompt";
  private static TOKEN_SELECTION_BIASES_JSON_FIELD = "token_selection_biases";
  private static RESPONSE_FORMAT_JSON_FIELD = "response_format";

  @JsonProperty({
    name: PromptExecutionSettings.SERVICE_ID_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_SERVICE_ID,
    required: true,
  })
  serviceId: string;

  @JsonProperty(PromptExecutionSettings.MODEL_ID_JSON_FIELD)
  private modelId: string;

  @JsonProperty({
    name: PromptExecutionSettings.TEMPERATURE_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_TEMPERATURE,
  })
  private temperature: number;

  @JsonProperty({
    name: PromptExecutionSettings.TOP_P_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_TOP_P,
  })
  private topP: number;

  @JsonProperty({
    name: PromptExecutionSettings.PRESENCE_PENALTY_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_PRESENCE_PENALTY,
  })
  private presencePenalty: number;

  @JsonProperty({
    name: PromptExecutionSettings.FREQUENCY_PENALTY_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_FREQUENCY_PENALTY,
    required: true,
  })
  private frequencyPenalty: number;

  @JsonProperty({
    name: PromptExecutionSettings.MAX_TOKENS_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_MAX_TOKENS,
  })
  private maxTokens: number;

  @JsonProperty({
    name: PromptExecutionSettings.BEST_OF_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_BEST_OF,
  })
  private bestOf: number;

  @JsonProperty({
    name: PromptExecutionSettings.RESULTS_PER_PROMPT_JSON_FIELD,
    defaultValue: PromptExecutionSettings.DEFAULT_RESULTS_PER_PROMPT,
  })
  private resultsPerPrompt: number;

  @JsonProperty(PromptExecutionSettings.USER_JSON_FIELD)
  private user: string;

  @JsonProperty({
    name: PromptExecutionSettings.STOP_SEQUENCES_JSON_FIELD,
    type() {
      return Array;
    },
  })
  private stopSequences: string[];

  @JsonProperty({
    name: PromptExecutionSettings.TOKEN_SELECTION_BIASES_JSON_FIELD,
    type() {
      return Object;
    },
  })
  private tokenSelectionBiases: Record<number, number>;

  @JsonProperty({
    name: PromptExecutionSettings.STOP_SEQUENCES_JSON_FIELD,
    defaultValue: ResponseFormat.JSON_OBJECT,
  })
  private responseFormat: ResponseFormat;

  constructor(
    serviceId: string,
    modelId: string,
    temperature: number,
    topP: number,
    presencePenalty: number,
    frequencyPenalty: number,
    maxTokens: number,
    resultsPerPrompt: number,
    bestOf: number,
    user: string,
    stopSequences?: string[],
    tokenSelectionBiases?: Record<number, number>,
    responseFormat?: ResponseFormat
  ) {
    this.serviceId = serviceId ?? PromptExecutionSettings.DEFAULT_SERVICE_ID;
    this.modelId = modelId ?? "";
    this.temperature = clamp(
      temperature || PromptExecutionSettings.DEFAULT_TEMPERATURE,
      0,
      2
    );
    this.topP = clamp(topP || PromptExecutionSettings.DEFAULT_TOP_P, 0, 1);
    this.presencePenalty = clamp(
      presencePenalty || PromptExecutionSettings.DEFAULT_PRESENCE_PENALTY,
      -2,
      2
    );
    this.frequencyPenalty = clamp(
      frequencyPenalty || PromptExecutionSettings.DEFAULT_FREQUENCY_PENALTY,
      -2,
      2
    );
    this.maxTokens = clamp(
      maxTokens || PromptExecutionSettings.DEFAULT_MAX_TOKENS,
      1,
      Number.MAX_VALUE
    );
    this.resultsPerPrompt = clamp(
      resultsPerPrompt || PromptExecutionSettings.DEFAULT_RESULTS_PER_PROMPT,
      1,
      Number.MAX_VALUE
    );
    this.bestOf = clamp(
      bestOf || PromptExecutionSettings.DEFAULT_BEST_OF,
      1,
      Number.MAX_VALUE
    );
    this.user = user ?? "";
    this.stopSequences = stopSequences || [];
    this.tokenSelectionBiases = tokenSelectionBiases || {};
    this.tokenSelectionBiases = Object.entries(
      this.tokenSelectionBiases
    ).reduce((acc, [k, v]) => ({ ...acc, [k]: clamp(v, -100, 100) }), {});

    this.responseFormat = responseFormat || ResponseFormat.TEXT;
  }

  private static _Builder = {
    settings: new Map<string, any>(),

    /**
     * Set the id of the AI service to use for prompt execution.
     *
     * @param serviceId The id of the AI service to use for prompt execution.
     * @return This builder.
     */
    withServiceId(serviceId: string) {
      this.settings.set(
        PromptExecutionSettings.SERVICE_ID_JSON_FIELD,
        serviceId
      );
      return this;
    },

    /**
     * Set the id of the model to use for prompt execution.
     *
     * @param modelId The id of the model to use for prompt execution.
     * @return This builder.
     */
    withModelId(modelId: string) {
      this.settings.set(PromptExecutionSettings.MODEL_ID_JSON_FIELD, modelId);
      return this;
    },

    /**
     * Set the temperature setting for prompt execution. The value is clamped to the range [0.0,
     * 2.0], and the default is 1.0.
     *
     * @param temperature The temperature setting for prompt execution.
     * @return This builder.
     */
    withTemperature(temperature: number) {
      this.settings.set(
        PromptExecutionSettings.TEMPERATURE_JSON_FIELD,
        temperature
      );
      return this;
    },

    /**
     * Set the topP setting for prompt execution. The value is clamped to the range [0.0, 1.0],
     * and the default is 1.0.
     *
     * @param topP The topP setting for prompt execution.
     * @return This builder.
     */
    withTopP(topP: number) {
      this.settings.set(PromptExecutionSettings.TOP_P_JSON_FIELD, topP);
      return this;
    },

    /**
     * Set the presence penalty setting for prompt execution. The value is clamped to the range
     * [-2.0, 2.0], and the default is 0.0.
     *
     * @param presencePenalty The presence penalty setting for prompt execution.
     * @return This builder.
     */
    withPresencePenalty(presencePenalty: number) {
      this.settings.set(
        PromptExecutionSettings.PRESENCE_PENALTY_JSON_FIELD,
        presencePenalty
      );
      return this;
    },

    /**
     * Set the frequency penalty setting for prompt execution. The value is clamped to the range
     * [-2.0, 2.0], and the default is 0.0.
     *
     * @param frequencyPenalty The frequency penalty setting for prompt execution.
     * @return This builder.
     */
    withFrequencyPenalty(frequencyPenalty: number) {
      this.settings.set(
        PromptExecutionSettings.FREQUENCY_PENALTY_JSON_FIELD,
        frequencyPenalty
      );

      return this;
    },

    /**
     * Set the maximum number of tokens to generate in the output. The value is clamped to the
     * range [1, Integer.MAX_VALUE], and the default is 256.
     *
     * @param maxTokens The maximum number of tokens to generate in the output.
     * @return This builder.
     */
    withMaxTokens(maxTokens: number) {
      this.settings.set(
        PromptExecutionSettings.MAX_TOKENS_JSON_FIELD,
        maxTokens
      );
      return this;
    },

    /**
     * Set the number of results to generate for each prompt. The value is clamped to the range
     * [1, Integer.MAX_VALUE], and the default is 1.
     *
     * @param resultsPerPrompt The number of results to generate for each prompt.
     * @return This builder.
     */
    withResultsPerPrompt(resultsPerPrompt: number) {
      this.settings.set(
        PromptExecutionSettings.RESULTS_PER_PROMPT_JSON_FIELD,
        resultsPerPrompt
      );
      return this;
    },

    /**
     * Set the best of setting for prompt execution. The value is clamped to the range [1,
     * Integer.MAX_VALUE], and the default is 1.
     *
     * @param bestOf The best of setting for prompt execution.
     * @return This builder.
     */
    withBestOf(bestOf: number) {
      this.settings.set(PromptExecutionSettings.BEST_OF_JSON_FIELD, bestOf);
      return this;
    },

    /**
     * Set the user to associate with the prompt execution.
     *
     * @param user The user to associate with the prompt execution.
     * @return This builder.
     */
    withUser(user: string) {
      this.settings.set(PromptExecutionSettings.USER_JSON_FIELD, user);
      return this;
    },

    /**
     * Set the stop sequences to use for prompt execution.
     *
     * @param stopSequences The stop sequences to use for prompt execution.
     * @return This builder.
     */
    withStopSequences(stopSequences: string[]) {
      this.settings.set(
        PromptExecutionSettings.STOP_SEQUENCES_JSON_FIELD,
        stopSequences
      );
      return this;
    },

    /**
     * Set the token selection biases to use for prompt execution. The bias values are clamped
     * to the range [-100, 100].
     *
     * @param tokenSelectionBiases The token selection biases to use for prompt execution.
     * @return This builder.
     */
    withTokenSelectionBiases(tokenSelectionBiases: Record<number, number>) {
      this.settings.set(
        PromptExecutionSettings.TOKEN_SELECTION_BIASES_JSON_FIELD,
        tokenSelectionBiases
      );
      return this;
    },

    /**
     * Set the response format to use for prompt execution.
     *
     * @param responseFormat The response format to use for prompt execution.
     * @return This builder.
     */
    withResponseFormat(responseFormat: ResponseFormat) {
      this.settings.set(
        PromptExecutionSettings.RESPONSE_FORMAT_JSON_FIELD,
        responseFormat
      );
      return this;
    },

    /**
     * Set the response format to use a json schema generated for the given class. The name of
     * the response format will be the name of the class.
     *
     * @param responseFormat The response format type.
     * @return This builder.
     */
    withJsonSchemaResponseFormat() {
      this.settings.set(
        PromptExecutionSettings.RESPONSE_FORMAT_JSON_FIELD,
        ResponseFormat.JSON_OBJECT
      );
      return this;
    },

    build(): PromptExecutionSettings {
      return new PromptExecutionSettings(
        this.settings.get(PromptExecutionSettings.SERVICE_ID_JSON_FIELD) ??
          PromptExecutionSettings.DEFAULT_SERVICE_ID,
        this.settings.get(PromptExecutionSettings.MODEL_ID_JSON_FIELD) ?? "",
        this.settings.get(PromptExecutionSettings.TEMPERATURE_JSON_FIELD) ??
          PromptExecutionSettings.DEFAULT_TEMPERATURE,
        this.settings.get(PromptExecutionSettings.TOP_P_JSON_FIELD) ??
          PromptExecutionSettings.DEFAULT_TOP_P,
        this.settings.get(
          PromptExecutionSettings.PRESENCE_PENALTY_JSON_FIELD
        ) ?? PromptExecutionSettings.DEFAULT_PRESENCE_PENALTY,
        this.settings.get(
          PromptExecutionSettings.FREQUENCY_PENALTY_JSON_FIELD
        ) ?? PromptExecutionSettings.DEFAULT_FREQUENCY_PENALTY,
        this.settings.get(PromptExecutionSettings.MAX_TOKENS_JSON_FIELD) ??
          PromptExecutionSettings.DEFAULT_MAX_TOKENS,
        this.settings.get(
          PromptExecutionSettings.RESULTS_PER_PROMPT_JSON_FIELD
        ) ?? PromptExecutionSettings.DEFAULT_RESULTS_PER_PROMPT,
        this.settings.get(PromptExecutionSettings.BEST_OF_JSON_FIELD) ??
          PromptExecutionSettings.DEFAULT_BEST_OF,
        this.settings.get(PromptExecutionSettings.USER_JSON_FIELD) ?? "",
        this.settings.get(PromptExecutionSettings.STOP_SEQUENCES_JSON_FIELD) ??
          [],
        this.settings.get(
          PromptExecutionSettings.TOKEN_SELECTION_BIASES_JSON_FIELD
        ) ?? {},
        this.settings.get(PromptExecutionSettings.RESPONSE_FORMAT_JSON_FIELD) ??
          ResponseFormat.TEXT
      );
    },
  };

  static Builder(): typeof PromptExecutionSettings._Builder {
    return PromptExecutionSettings._Builder;
  }
}

export default PromptExecutionSettings;
