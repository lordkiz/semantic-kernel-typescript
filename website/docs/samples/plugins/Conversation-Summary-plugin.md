---
sidebar_position: 1
---

# Conversation Summary Plugin

First let us create a plugin that can take a chat conversation and output a summary, action items and topics.

### ConversationSummaryPlugin

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import {
  DefineKernelFunction,
  KernelArguments,
  KernelFunction,
  KernelFunctionFactory,
  KernelFunctionParameter,
} from "@semantic-kernel-typescript/core/functions"
import {
  InvocationContext,
  PromptExecutionSettings,
} from "@semantic-kernel-typescript/core/orchestration"
import { ServiceClass } from "@semantic-kernel-typescript/core/services/types/AIServiceSelector"
import { TextChunker } from "@semantic-kernel-typescript/core/text"
import { mergeMap, Observable, of, reduce } from "rxjs"

class PromptFunctionConstants {
  public static SummarizeConversationDefinition = `
        BEGIN CONTENT TO SUMMARIZE:
        {{$input}}

        END CONTENT TO SUMMARIZE.

        Summarize the conversation in 'CONTENT TO SUMMARIZE', identifying main points of discussion and any conclusions that were reached.
        Do not incorporate other general knowledge.
        Summary is in plain text, in complete sentences, with no markup or tags.

        BEGIN SUMMARY:
        `

  public static GetConversationActionItemsDefinition = `
        You are an action item extractor. You will be given chat history and need to make note of action items mentioned in the chat.
        Extract action items from the content if there are any. If there are no action, return nothing. If a single field is missing, use an empty string.
        Return the action items in json.

        Possible statuses for action items are: Open, Closed, In Progress.

        EXAMPLE INPUT WITH ACTION ITEMS:

        John Doe said: "I will record a demo for the new feature by Friday"
        I said: "Great, thanks John. We may not use all of it but it's good to get it out there."

        EXAMPLE OUTPUT:
        {
            "actionItems": [
                {
                    "owner": "John Doe",
                    "actionItem": "Record a demo for the new feature",
                    "dueDate": "Friday",
                    "status": "Open",
                    "notes": ""
                }
            ]
        }

        EXAMPLE INPUT WITHOUT ACTION ITEMS:

        John Doe said: "Hey I'm going to the store, do you need anything?"
        I said: "No thanks, I'm good."

        EXAMPLE OUTPUT:
        {
            "action_items": []
        }

        CONTENT STARTS HERE.

        {{$input}}

        CONTENT STOPS HERE.

        OUTPUT:
        `

  public static GetConversationTopicsDefinition = `
        Analyze the following extract taken from a conversation transcript and extract key topics.
        - Topics only worth remembering.
        - Be brief. Short phrases.
        - Can use broken English.
        - Conciseness is very important.
        - Topics can include names of memories you want to recall.
        - NO LONG SENTENCES. SHORT PHRASES.
        - Return in JSON
        [Input]
        My name is Macbeth. I used to be King of Scotland, but I died. My wife's name is Lady Macbeth and we were married for 15 years. We had no children. Our beloved dog Toby McDuff was a famous hunter of rats in the forest.
        My tragic story was immortalized by Shakespeare in a play.
        [Output]
        {
          "topics": [
            "Macbeth",
            "King of Scotland",
            "Lady Macbeth",
            "Dog",
            "Toby McDuff",
            "Shakespeare",
            "Play",
            "Tragedy"
          ]
        }
        +++++
        [Input]
        {{$input}}
        [Output]`
}

class ConversationSummaryPlugin {
  private summarizeConversationFunction: KernelFunction<string>
  private conversationActionItemsFunction: KernelFunction<string>
  private conversationTopicsFunction: KernelFunction<string>
  private promptExecutionSettings: PromptExecutionSettings
  private maxTokens: number = 1024

  private serviceClass: ServiceClass<any>

  constructor(
    service: ServiceClass<any>,
    promptExecutionSettings: PromptExecutionSettings,
    /** The max tokens to process in a single prompt function call.  */
    maxTokens?: number
  ) {
    this.serviceClass = service
    this.promptExecutionSettings = promptExecutionSettings

    if (maxTokens) {
      this.maxTokens = maxTokens
    }

    this.summarizeConversationFunction = KernelFunctionFactory.createFromPrompt<string>(
      PromptFunctionConstants.SummarizeConversationDefinition
    )
      .withExecutionSettings(this.promptExecutionSettings)
      .withName("summarizeConversation")
      .withDescription(
        "Given a section of a conversation transcript, summarize the part of the conversation."
      )
      .build()

    this.conversationActionItemsFunction = KernelFunctionFactory.createFromPrompt<string>(
      PromptFunctionConstants.GetConversationActionItemsDefinition
    )
      .withExecutionSettings(promptExecutionSettings)
      .withName("conversationActionItems")
      .withDescription("Given a section of a conversation transcript, identify action items.")
      .build()

    this.conversationTopicsFunction = KernelFunctionFactory.createFromPrompt<string>(
      PromptFunctionConstants.GetConversationTopicsDefinition
    )
      .withExecutionSettings(promptExecutionSettings)
      .withName("conversationTopics")
      .withDescription(
        "Analyze a conversation transcript and extract key topics worth remembering."
      )
      .build()
  }

  private processAsync(
    func: KernelFunction<string>,
    input: string,
    kernel: Kernel
  ): Observable<string> {
    const lines: string[] = TextChunker.splitPlainTextLines(input, this.maxTokens)
    const paragraphs: string[] = TextChunker.splitPlainTextParagraphs(lines, this.maxTokens)

    return of(paragraphs).pipe(
      mergeMap((paragraph) => {
        return func
          .invokeAsync(
            kernel,
            KernelArguments.Builder().withInput(paragraph).build(),
            InvocationContext.Builder().withServiceClass(this.serviceClass).build()
          )
          .pipe(reduce((acc, val) => acc + "\n" + val.result, ""))
      })
    )
  }

  /**
   * Given a long conversation transcript, summarize the conversation.
   * @param input - A long conversation transcript.
   * @param kernel - The Kernel containing services, plugins, and other state for use throughout the operation.
   * @returns Observable<string>
   */
  @DefineKernelFunction({
    description: "Given a long conversation transcript, summarize the conversation.",
    name: "SummarizeConversationAsync",
  })
  public SummarizeConversationAsync(
    @KernelFunctionParameter({ description: "A long conversation transcript.", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Kernel to use", name: "kernel" })
    kernel: Kernel
  ): Observable<string> {
    return this.processAsync(this.summarizeConversationFunction, input, kernel)
  }

  /**
   * Given a long conversation transcript, identify action items.
   * @param input - A long conversation transcript.
   * @param kernel - The Kernel containing services, plugins, and other state for use throughout the operation.
   * @returns Observable<string>
   */
  @DefineKernelFunction({
    description: "Given a long conversation transcript, identify action items.",
    name: "GetConversationActionItemsAsync",
  })
  public GetConversationActionItemsAsync(
    @KernelFunctionParameter({ description: "A long conversation transcript.", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Kernel to use", name: "kernel" })
    kernel: Kernel
  ): Observable<string> {
    return this.processAsync(this.conversationActionItemsFunction, input, kernel)
  }

  /**
   * Given a long conversation transcript, identify topics.
   * @param input - A long conversation transcript.
   * @param kernel - The Kernel containing services, plugins, and other state for use throughout the operation.
   * @returns Observable<string>
   */
  @DefineKernelFunction({
    description: "Given a long conversation transcript, identify topics worth remembering.",
    name: "GetConversationTopicsAsync",
  })
  public GetConversationTopicsAsync(
    @KernelFunctionParameter({ description: "A long conversation transcript.", name: "input" })
    input: string,
    @KernelFunctionParameter({ description: "Kernel to use", name: "kernel" })
    kernel: Kernel
  ): Observable<string> {
    return this.processAsync(this.conversationTopicsFunction, input, kernel)
  }
}
```

With the creation of our native plugin above, we can go ahead and use it in our workflow.

### Using the Conversation summary plugin:

```ts
import { Kernel } from "@semantic-kernel-typescript/core"
import { KernelArguments } from "@semantic-kernel-typescript/core/functions"
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
import { lastValueFrom, Observable } from "rxjs"

const OPENAI_API_KEY = "OPEN_AI_KEY"
const MODEL_ID = "gpt-4.1"

// Initialize  client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const chatTranscript = `
  John: Hello, how are you?
  Jane: I'm fine, thanks. How are you?
  John: I'm doing well, writing some example code.
  Jane: That's great! I'm writing some example code too.
  John: What are you writing?
  Jane: I'm writing a chatbot.
  John: That's cool. I'm writing a chatbot too.
  Jane: What language are you writing it in?
  John: I'm writing it in C#.
  Jane: I'm writing it in Python.
  John: That's cool. I need to learn Python.
  Jane: I need to learn C#.
  John: Can I try out your chatbot?
  Jane: Sure, here's the link.
  John: Thanks!
  Jane: You're welcome.
  Jane: Look at this poem my chatbot wrote:
  Jane: Roses are red
  Jane: Violets are blue
  Jane: I'm writing a chatbot
  Jane: What about you?
  John: That's cool. Let me see if mine will write a poem, too.
  John: Here's a poem my chatbot wrote:
  John: The singularity of the universe is a mystery.
  John: The universe is a mystery.
  John: The universe is a mystery.
  John: The universe is a mystery.
  John: Looks like I need to improve mine, oh well.
  Jane: You might want to try using a different model.
  Jane: I'm using the GPT-3 model.
  John: I'm using the GPT-2 model. That makes sense.
  John: Here is a new poem after updating the model.
  John: The universe is a mystery.
  John: The universe is a mystery.
  John: The universe is a mystery.
  John: Yikes, it's really stuck isn't it. Would you help me debug my code?
  Jane: Sure, what's the problem?
  John: I'm not sure. I think it's a bug in the code.
  Jane: I'll take a look.
  Jane: I think I found the problem.
  Jane: It looks like you're not passing the right parameters to the model.
  John: Thanks for the help!
  Jane: I'm now writing a bot to summarize conversations. I want to make sure it works when the conversation is long.
  John: So you need to keep talking with me to generate a long conversation?
  Jane: Yes, that's right.
  John: Ok, I'll keep talking. What should we talk about?
  Jane: I don't know, what do you want to talk about?
  John: I don't know, it's nice how CoPilot is doing most of the talking for us. But it definitely gets stuck sometimes.
  Jane: I agree, it's nice that CoPilot is doing most of the talking for us.
  Jane: But it definitely gets stuck sometimes.
  John: Do you know how long it needs to be?
  Jane: I think the max length is 1024 tokens. Which is approximately 1024*4= 4096 characters.
  John: That's a lot of characters.
  Jane: Yes, it is.
  John: I'm not sure how much longer I can keep talking.
  Jane: I think we're almost there. Let me check.
  Jane: I have some bad news, we're only half way there.
  John: Oh no, I'm not sure I can keep going. I'm getting tired.
  Jane: I'm getting tired too.
  John: Maybe there is a large piece of text we can use to generate a long conversation.
  Jane: That's a good idea. Let me see if I can find one. Maybe Lorem Ipsum?
  John: Yeah, that's a good idea.
  Jane: I found a Lorem Ipsum generator.
  Jane: Here's a 4096 character Lorem Ipsum text:
  Jane: Lorem ipsum dolor sit amet, con
  Jane: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc sit amet aliquam
  Jane: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nunc sit amet aliquam
  Jane: Darn, it's just repeating stuff now.
  John: I think we're done.
  Jane: We're not though! We need like 1500 more characters.
  John: Oh Cananda, our home and native land.
  Jane: True patriot love in all thy sons command.
  John: With glowing hearts we see thee rise.
  Jane: The True North strong and free.
  John: From far and wide, O Canada, we stand on guard for thee.
  Jane: God keep our land glorious and free.
  John: O Canada, we stand on guard for thee.
  Jane: O Canada, we stand on guard for thee.
  Jane: That was fun, thank you. Let me check now.
  Jane: I think we need about 600 more characters.
  John: Oh say can you see?
  Jane: By the dawn's early light.
  John: What so proudly we hailed.
  Jane: At the twilight's last gleaming.
  John: Whose broad stripes and bright stars.
  Jane: Through the perilous fight.
  John: O'er the ramparts we watched.
  Jane: Were so gallantly streaming.
  John: And the rockets' red glare.
  Jane: The bombs bursting in air.
  John: Gave proof through the night.
  Jane: That our flag was still there.
  John: Oh say does that star-spangled banner yet wave.
  Jane: O'er the land of the free.
  John: And the home of the brave.
  Jane: Are you a Seattle Kraken Fan?
  John: Yes, I am. I love going to the games.
  Jane: I'm a Seattle Kraken Fan too. Who is your favorite player?
  John: I like watching all the players, but I think my favorite is Matty Beniers.
  Jane: Yeah, he's a great player. I like watching him too. I also like watching Jaden Schwartz.
  John: Adam Larsson is another good one. The big cat!
  Jane: WE MADE IT! It's long enough. Thank you!
  John: Can you automate generating long text next time?
  Jane: I will.
  John: You're welcome. I'm glad we could help. Goodbye!
  Jane: Goodbye!
`

const getKernel = () => {
  const openAIChatCompletionService = OpenAIChatCompletion.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const promptExecutionSettings =
    PromptExecutionSettings.Builder<OpenAIChatCompletionPromptExecutionSettings>()
      .max_completion_tokens(1024)
      .top_p(0.5)
      .temperature(0.1)
      .build()

  const conversationSummaryPlugin = KernelPluginFactory.createFromObject(
    new ConversationSummaryPlugin(OpenAIChatCompletion, promptExecutionSettings),
    "ConversationSummary"
  )

  return Kernel.Builder()
    .withAIService(OpenAIChatCompletion, openAIChatCompletionService)
    .withPlugin(conversationSummaryPlugin)
    .build()
}

const getConversationActionItemsAsync = async () => {
  console.log("======== SamplePlugins - Conversation Summary Plugin - Action Items ========")

  const kernel = getKernel()
  const actionItems = await kernel.invoke<Observable<string>>(
    { pluginName: "ConversationSummary", functionName: "GetConversationActionItemsAsync" },
    KernelArguments.Builder().withInput(chatTranscript).withVariable("kernel", kernel).build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  console.log("Action Items: ")

  console.log(await lastValueFrom(actionItems.result))
}

const getConversationTopicsAsync = async () => {
  console.log("======== SamplePlugins - Conversation Summary Plugin - Topics ========")

  const kernel = getKernel()
  const topics = await kernel.invoke<Observable<string>>(
    { pluginName: "ConversationSummary", functionName: "GetConversationTopicsAsync" },
    KernelArguments.Builder().withInput(chatTranscript).withVariable("kernel", kernel).build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  console.log("Topics: ")
  console.log(await lastValueFrom(topics.result))
}

const getConversationSummaryAsync = async () => {
  console.log("======== SamplePlugins - Conversation Summary Plugin - Summary ========")

  const kernel = getKernel()
  const summary = await kernel.invoke<Observable<string>>(
    { pluginName: "ConversationSummary", functionName: "SummarizeConversationAsync" },
    KernelArguments.Builder().withInput(chatTranscript).withVariable("kernel", kernel).build(),
    InvocationContext.Builder().withServiceClass(OpenAIChatCompletion).build()
  )

  console.log("Summary: ")

  console.log(await lastValueFrom(summary.result))
}

const main = async () => {
  await getConversationActionItemsAsync()
  await getConversationTopicsAsync()
  await getConversationSummaryAsync()
}

main()
```
