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
import { GoogleConnector } from "../../connectors/GoogleConnector"
import { WebSearchEnginePlugin } from "../../plugins/WebSearchEnginePlugin"

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

  console.log(answer.getResult())
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

  const result = answer.getResult()

  if (result.includes("google.searchAsync")) {
    const promptTemplate = new KernelPromptTemplateFactory().tryCreate(
      PromptTemplateConfig.Builder().withTemplate(result).build()
    )

    console.log("---- Fetching information from Google...")

    const information = await lastValueFrom(promptTemplate.renderAsync(kernel))

    console.log("information found: ")
    console.log(information.getResult())

    kernelArguments = KernelArguments.Builder()
      .withVariable("question", question)
      .withVariable("externalInformation", information.getResult())
      .build()

    answer = await kernel.invoke(kernelFunction, kernelArguments, invocationContext)
  } else {
    console.log("AI had all the information, no need to query Google.")
  }

  console.log("---- ANSWER:")
  console.log(answer.getResult())
}

main()
