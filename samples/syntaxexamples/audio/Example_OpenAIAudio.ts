import {
  AudioContent,
  AudioToTextExecutionSettings,
  TextToAudioExecutionSettings,
} from "@semantic-kernel-typescript/core/services/audio"
import {
  OpenAIAudioToTextService,
  OpenAITextToAudioService,
} from "@semantic-kernel-typescript/openai/audio"
import fs from "fs"
import OpenAI from "openai"
import { SpeechCreateParams, TranscriptionCreateParamsNonStreaming } from "openai/resources/audio"
import { lastValueFrom } from "rxjs"

// Configuration
const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY"
const MODEL_ID = "tts-1"

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: OPENAI_API_KEY,
})

const textToAudioAsync = async () => {
  const textToAudioService = OpenAITextToAudioService.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const sampleText =
    "Hello, my name is John. I am a software engineer. I am working on a project to convert text to audio."

  const executionSettings: TextToAudioExecutionSettings<SpeechCreateParams> =
    TextToAudioExecutionSettings.Builder<SpeechCreateParams>()
      .voice("alloy")
      .response_format("mp3")
      .speed(1.0)
      .build()

  const audioContent = await lastValueFrom(
    textToAudioService.getAudioContentAsync(sampleText, executionSettings)
  )

  const speechPath = __dirname + "/speech.mp3"

  await fs.promises.writeFile(speechPath, audioContent.data)
}

const audioToTextAsync = async () => {
  const audioToTextService = OpenAIAudioToTextService.Builder()
    .withClient(client)
    .withModelId(MODEL_ID)
    .build()

  const audio = fs.readFileSync(__dirname + "/speech.mp3")
  console.log("audio", audio)

  const audioContent = AudioContent.Builder().withData(audio).withModelId(MODEL_ID).build()

  const executionSettings: AudioToTextExecutionSettings<TranscriptionCreateParamsNonStreaming> =
    AudioToTextExecutionSettings.Builder<TranscriptionCreateParamsNonStreaming>()
      .language("en")
      .prompt("sample prompt")
      .response_format("json")
      .temperature(0.3)
      .build()

  const text = await lastValueFrom(
    audioToTextService.getTextContentsAsync(audioContent, executionSettings)
  )

  console.log("text: ", text)
}

const main = async () => {
  console.log("======== OpenAI - Audio ========")
  await textToAudioAsync()
  await audioToTextAsync()
}

main()
