import { Kernel } from "@semantic-kernel-typescript/core"
import { AutoFunctionChoiceBehavior } from "@semantic-kernel-typescript/core/functionchoice"
import { InvocationContext } from "@semantic-kernel-typescript/core/orchestration"
import { KernelPluginFactory } from "@semantic-kernel-typescript/core/plugin"
import { OpenAIChatCompletion } from "@semantic-kernel-typescript/openai/chatcompletion"
import OpenAI from "openai"
import GitHubPlugin from "../../plugins/GithubPlugin"

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
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
}

main()
