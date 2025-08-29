---
sidebar_position: 1
---

# Agents - Completion Agent Example

In this example, we demonstrate how the `@semantic-kernel-typescript/agents` package can be used to create powerful agentic workflows. This package provides the building blocks for designing agents that can reason, plan, and act by combining natural language with external tools and plugins.

The sample below highlights how an agent can seamlessly interact with a GitHub plugin, allowing it to perform real-world tasks such as retrieving repository information, managing issues, or automating developer workflows. By wiring the agent to a plugin, you can extend its capabilities beyond simple text responses and enable it to take meaningful actions in your applications.

```ts
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
import { GitHubPlugin } from "../../plugins/GithubPlugin" // 👈 Your native Github plugin. See implementation below

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
```

Now that we have created a workflow, let us create the Github plugin which we can plug into our kernel.

#### Github Plugin

```ts
import {
  DefineKernelFunction,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"

export class GitHubPlugin {
  public static baseUrl = "https://api.github.com"
  private readonly token

  constructor(token: string) {
    this.token = token
  }

  @DefineKernelFunction({
    name: "getUserProfileAsync",
    description: "Get user information from GitHub",
  })
  public async getUserProfileAsync() {
    return this.makeRequest("/user")
  }

  @DefineKernelFunction({
    name: "getRepositoryAsync",
    description: "Get repository information from GitHub",
  })
  public getRepositoryAsync(
    @KernelFunctionParameter({
      name: "organization",
      description: "The name of the repository to retrieve information for",
    })
    organization: string,
    @KernelFunctionParameter({
      name: "repoName",
      description: "The name of the repository to retrieve information for",
    })
    repoName: string
  ) {
    const query = `/repos/${organization}/${repoName}`
    return this.makeRequest(query)
  }

  @DefineKernelFunction({ name: "getIssuesAsync", description: "Get issues from GitHub" })
  public getIssuesAsync(
    @KernelFunctionParameter({
      name: "organization",
      description: "The name of the organization to retrieve issues for",
    })
    organization: string,
    @KernelFunctionParameter({
      name: "repoName",
      description: "The name of the repository to retrieve issues for",
    })
    repoName: string,
    @KernelFunctionParameter({
      name: "maxResults",
      description: "The maximum number of issues to retrieve",
      required: false,
      defaultValue: 10,
    })
    maxResults: number,
    @KernelFunctionParameter({
      name: "state",
      description: "The state of the issues to retrieve",
      required: false,
      defaultValue: "open",
    })
    state: string,
    @KernelFunctionParameter({
      name: "assignee",
      description: "The assignee of the issues to retrieve",
      required: false,
    })
    assignee: string
  ) {
    let query = `/repos/${organization}/${repoName}/issues`
    query = GitHubPlugin.buildQueryString(query, "state", state)
    query = GitHubPlugin.buildQueryString(query, "assignee", assignee)
    query = GitHubPlugin.buildQueryString(query, "per_page", `${maxResults}`)

    return this.makeRequest(query)
  }

  @DefineKernelFunction({
    name: "getIssueDetailAsync",
    description: "Get detail information of a single issue from GitHub",
  })
  public async getIssueDetailAsync(
    @KernelFunctionParameter({
      name: "organization",
      description: "The name of the repository to retrieve information for",
    })
    organization: string,
    @KernelFunctionParameter({
      name: "repo_name",
      description: "The name of the repository to retrieve information for",
    })
    repoName: string,
    @KernelFunctionParameter({
      name: "issue_number",
      description: "The issue number to retrieve information for",
    })
    issueNumber: number
  ) {
    const query = `/repos/${organization}/${repoName}/issues/${issueNumber}`
    return this.makeRequest(query)
  }

  private async makeRequest(query: string) {
    const json = (
      await fetch(GitHubPlugin.baseUrl + query, {
        headers: {
          "User-Agent": "request",
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + this.token,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        method: "GET",
      })
    ).json()
    const response = await json
    return response
  }

  private static buildQueryString(path: string, param: string, value: string) {
    if (!value) {
      return path
    }

    return path + (path.includes("?") ? "&" : "?") + param + "=" + value
  }
}
```
