---
sidebar_position: 2
---

# Google Search Plugin

This plugin enables Semantic Kernel applications to perform real-time Google searches and retrieve relevant information directly within workflows. By integrating search capabilities, the plugin allows AI-powered agents to go beyond static knowledge and access up-to-date web results. This makes it particularly useful for tasks such as research, fact-checking, market analysis, competitive intelligence, and answering user queries that depend on current events or frequently changing data.

First, let us design a simple Connector

### GoogleConnector

```ts
import { WebPage, WebSearchEngineConnector } from "@semantic-kernel-typescript/core/connectors"
import { JsonProperty } from "@semantic-kernel-typescript/core/decorators"
import { JsonCreator } from "@semantic-kernel-typescript/core/implementations"
import { from, lastValueFrom, map, mergeMap } from "rxjs"

type GoogleSearchResponse = {
  items: {
    title: string
    link: string
    snippet: string
  }[]
}

export class GoogleConnector implements WebSearchEngineConnector {
  static GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"

  private apiKey: string
  private programmableSearchEngineId: string

  constructor(apiKey: string, programmableSearchEngineId: string) {
    this.apiKey = apiKey
    this.programmableSearchEngineId = programmableSearchEngineId
  }

  async searchAsync(query: string, count: number, offset: number): Promise<WebPage[]> {
    if (count <= 0 || 50 <= count) {
      throw new Error("count must be between 1 and 50")
    }

    if (offset < 0) {
      throw new Error("offset must be greater than or equal to 0")
    }

    const response = fetch(this.searchUrl(query, count, offset))

    return lastValueFrom(
      from(response).pipe(
        mergeMap((it) => it.json()),

        map((googleSearchResponse) => {
          if ((googleSearchResponse as any).error) {
            throw (googleSearchResponse as any).error
          }
          return (googleSearchResponse as GoogleSearchResponse).items.map(
            (m) => new GoogleWebPage(m.title, m.link, m.snippet)
          )
        })
      )
    )
  }

  private searchUrl(query: string, count: number, offset: number) {
    return (
      `${GoogleConnector.GOOGLE_SEARCH_URL}` +
      `?q=${encodeURIComponent(query)}` +
      `&num=${count}` +
      `&start=${offset}` +
      `&cx=${this.programmableSearchEngineId}` +
      `&key=${this.apiKey}`
    )
  }
}

class GoogleWebPage extends JsonCreator implements WebPage {
  @JsonProperty("name") private _name: string
  @JsonProperty("url") private _url: string
  @JsonProperty("snippet") private _snippet: string

  constructor(name: string, url: string, snippet: string) {
    super()
    this._name = name
    this._snippet = snippet
    this._url = url
  }

  get name() {
    return this._name
  }
  get snippet() {
    return this._snippet
  }
  get url() {
    return this._url
  }
}
```

Once we have our connector defined. We can go ahead and implement a general native search plugin.

### WebSearchEnginePlugin

```ts
import { type WebSearchEngineConnector } from "@semantic-kernel-typescript/core/connectors"
import { SKException } from "@semantic-kernel-typescript/core/exceptions"
import {
  DefineKernelFunction,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"
import { from, lastValueFrom, map } from "rxjs"

export class WebSearchEnginePlugin {
  /** The count parameter name. */
  public static COUNT_PARAM = "count"

  /** The offset parameter name. */
  public static OFFSET_PARAM = "offset"

  private readonly connector: WebSearchEngineConnector

  constructor(connector: WebSearchEngineConnector) {
    this.connector = connector
  }

  /** Performs a web search using the provided query, count, and offset. */
  @DefineKernelFunction({
    name: "searchAsync",
    description: "Searches the web for the given query",
  })
  public searchAsync(
    @KernelFunctionParameter({ description: "The search query", name: "query" }) query: string,
    @KernelFunctionParameter({
      description: "The number of results to return",
      name: "count",
      defaultValue: 1,
    })
    count: number,
    @KernelFunctionParameter({
      description: "The number of results to skip",
      name: "offset",
      defaultValue: 0,
    })
    offset: number
  ): Promise<string> {
    return lastValueFrom(
      from(this.connector.searchAsync(query, count, offset)).pipe(
        map((results) => {
          if (!results?.length) {
            throw new SKException("Failed to get a response from the web search engine.")
          }

          return count == 1
            ? results[0].snippet
            : JSON.stringify(results.slice(0, count).map((it) => it.snippet))
        })
      )
    )
  }
}
```

## Usage

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  KernelArguments,
  KernelFunctionFactory,
  KernelPromptTemplateFactory,
  PromptTemplateConfig,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import {
  OpenAIChatCompletion,
  OpenAIChatCompletionPromptExecutionSettings,
} from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"
import { lastValueFrom } from "rxjs"

const OPENAI_API_KEY = "OPENAI_API_KEY"
const MODEL_ID = "gpt-4.1"
const GOOGLE_API_KEY = "GOOGLE_API_KEY"
const GOOGLE_SEARCH_ENGINE_ID = "GOOGLE_SEARCH_ENGINE_ID"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const main = async () => {
  const googleConnector = new GoogleConnector(GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID)
  const google = KernelPluginFactory.createFromObject(
    new WebSearchEnginePlugin(googleConnector),
    "google"
  )

  const chatCompletionService = OpenAIChatCompletion.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const kernel = Kernel.Builder()
    .withAIService(OpenAIChatCompletion, chatCompletionService)
    .withPlugin(google)
    .build()

  await example1Async(kernel, "google")
  await example2Async(kernel)
}

const example1Async = async (kernel: Kernel, searchPluginName: string) => {
  console.log("======== Google Search Plugins ========")

  const question = "What is the largest building in the world"
  const kernelArguments = KernelArguments.Builder().withVariable("query", question).build()
  const invocationContext = InvocationContext.Builder()
    .withServiceClass(OpenAIChatCompletion)
    .build()

  const func = kernel.getFunction(searchPluginName, "searchAsync")
  const answer = await kernel.invoke(func, kernelArguments, invocationContext)

  console.log(question)
  console.log(`-------${searchPluginName}:  `)

  console.log(answer.result)
}

const example2Async = async (kernel: Kernel) => {
  console.log("======== Use Search Plugin to answer user questions ========")

  const semanticFunction = `
  Answer questions only when you know the facts or the information is provided.
  When you don't have sufficient information you reply with a list of commands to find the information needed.
  When answering multiple questions, use a bullet point list.
  Note: make sure single and double quotes are escaped using a backslash char.

  [COMMANDS AVAILABLE]
  - google.searchAsync

  [INFORMATION PROVIDED]
  {{ $externalInformation }}

  [EXAMPLE 1]
  Question: what's the biggest lake in Italy?
  Answer: Lake Garda, also known as Lago di Garda.

  [EXAMPLE 2]
  Question: what's the biggest lake in Italy? What's the smallest positive number?
  Answer:
  * Lake Garda, also known as Lago di Garda.
  * The smallest positive number is 1.

  [EXAMPLE 3]
  Question: what's Ferrari stock price? Who is the current number one female tennis player in the world?
  Answer:
  {{ '{{' }} google.searchAsync "what's Ferrari stock price?" {{ '}}' }}.
  {{ '{{' }} google.searchAsync "Who is the current number one female tennis player in the world?" {{ '}}' }}.

  [END OF EXAMPLES]

  [TASK]
  Question: {{ $question }}.
  Answer:
  `
  const question =
    "Who is the most followed person on TikTok right now? What's the exchange rate EUR:USD?"

  console.log(question)

  const promptExecutionSettings =
    PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
      .max_completion_tokens(150)
      .temperature(0)
      .top_p(1)
      .build()

  const invocationContext = InvocationContext.Builder()
    .withServiceClass(OpenAIChatCompletion)
    .build()

  const kernelFunction = KernelFunctionFactory.createFromPrompt<string>(semanticFunction)
    .withExecutionSettings(promptExecutionSettings)
    .build()

  let kernelArguments = KernelArguments.Builder()
    .withVariable("question", question)
    .withVariable("externalInformation", "")
    .build()

  let answer = await kernel.invoke(kernelFunction, kernelArguments, invocationContext)

  const result = answer.result

  if (result.includes("google.searchAsync")) {
    const promptTemplate = new KernelPromptTemplateFactory().tryCreate(
      PromptTemplateConfig.Builder().withTemplate(result).build()
    )

    console.log("---- Fetching information from Google...")

    const information = await lastValueFrom(promptTemplate.renderAsync(kernel))

    console.log("information found: ")
    console.log(information.result)

    kernelArguments = KernelArguments.Builder()
      .withVariable("question", question)
      .withVariable("externalInformation", information.result)
      .build()

    answer = await kernel.invoke(kernelFunction, kernelArguments, invocationContext)
  } else {
    console.log("AI had all the information, no need to query Google.")
  }

  console.log("---- ANSWER:")
  console.log(answer.result)
}

main()
```
