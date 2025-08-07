import { ChatCompletionAgent, ChatHistoryAgentThread } from "@semantic-kernel-typescript/agents"
import { Kernel } from "@semantic-kernel-typescript/core"
import { AgentInvokeOptions } from "@semantic-kernel-typescript/core/agents"
import { AutoFunctionChoiceBehavior } from "@semantic-kernel-typescript/core/functionchoice"
import {
  KernelArguments,
  KernelPromptTemplateFactory,
  PromptTemplateConfig,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import { AuthorRole, ChatMessageTextContent } from "@semantic-kernel-typescript/core/services"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import readline from "node:readline"
import OpenAI from "openai"
import { lastValueFrom } from "rxjs"
import GitHubPlugin from "../../plugins/GithubPlugin"

const OPENAI_API_KEY = "OPEN_AI_KEY"
const MODEL_ID = "gpt-4.1"
const GITHUB_TOKEN = "GITHUB_TOKEN"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const main = async () => {
  console.log("======== GithubAgent - OpenAI ========")

  const openAIChatCompletion = OpenAIChatCompletion.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const kernel = Kernel.Builder()
    .withAIService(OpenAIChatCompletion, openAIChatCompletion)
    .withPlugin(
      KernelPluginFactory.createFromObject(new GitHubPlugin(GITHUB_TOKEN), "GitHubPlugin")
    )
    .build()

  const invocationContext = InvocationContext.Builder()
    .withFunctionChoiceBehavior(new AutoFunctionChoiceBehavior(true))
    .withServiceClass(OpenAIChatCompletion)
    .build()

  const template = KernelPromptTemplateFactory.build(
    PromptTemplateConfig.Builder()
      .withTemplate(
        `
              You are an agent designed to query and retrieve information from a single GitHub repository in a read-only manner.
              You are also able to access the profile of the active user.

              Use the current date and time to provide up-to-date details or time-sensitive responses.

              The repository you are querying is a public repository with the following name: {{$repository}}

              The current date and time is: {{$now}}.`
      )
      .build()
  )

  const agent = ChatCompletionAgent.Builder()
    .withId("myAgentId")
    .withName("Chat completion agent")
    .withDescription("A github agent")
    .withKernel(kernel)
    .withKernelArguments(
      KernelArguments.Builder()
        .withVariable("repository", "microsoft/TypeScript")
        .withExecutionSettings(PromptExecutionSettings.Builder<any>().build())
        .build()
    )
    .withInvocationContext(invocationContext)
    .withTemplate(template)
    .build()

  let agentThread = new ChatHistoryAgentThread("myThreadId")

  const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  console.log("Type your prompt.  ")
  reader.on("line", async (prompt) => {
    if (prompt.toLowerCase() === "exit") {
      reader.close()
    }

    const messages = [new ChatMessageTextContent(AuthorRole.USER, prompt)]

    const kernelArguments = KernelArguments.Builder()
      .withVariable("now", new Date().getTime())
      .build()

    const response = await lastValueFrom(
      agent.invokeAsync(
        messages,
        agentThread,
        AgentInvokeOptions.Builder().withKernelArguments(kernelArguments).build()
      )
    )

    console.log("> " + response.map((r) => r.message).join(" "))
    agentThread = response[0].thread as ChatHistoryAgentThread

    console.log("\n\nType your prompt.  ")
  })
}

main()
