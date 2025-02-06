import { SpeechClient } from "@google-cloud/speech";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { PassThrough } from "stream";
import { validateAndRefreshToken } from "./google-auth";
// import { GoogleAuth } from "google-auth-library";

export class SpeechService {
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;

  constructor(private refreshToken?: string) {
    // Initialize with default credentials for now
    // The actual clients will be created when needed
    this.speechClient = new SpeechClient();
    this.ttsClient = new TextToSpeechClient();
  }

  async createSpeechStream() {
    await this.getAuthenticatedClients();
    const encoding = "LINEAR16" as const;
    const sampleRateHertz = 16000 as const;
    const languageCode = "en-US" as const;

    const request = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: "latest_long",
      },
      interimResults: true,
    };

    const recognizeStream = this.speechClient
      .streamingRecognize(request)
      .on("error", (error) => console.error("Speech stream error:", error))
      .on("data", (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcription = data.results[0].alternatives[0].transcript;
          // Handle transcription
          return {
            text: transcription,
            isFinal: data.results[0].isFinal,
          };
        }
      });

    return recognizeStream;
  }

  private async getAuthenticatedClients() {
    if (!this.refreshToken) {
      throw new Error("No refresh token provided. Please authenticate first.");
    }

    const { client, credentials } = await validateAndRefreshToken(
      this.refreshToken
    );
    if (!client || !credentials?.access_token) {
      throw new Error("Failed to get OAuth client or credentials");
    }

    // Create new instances with the credentials
    this.speechClient = new SpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
      },
      projectId: process.env.GOOGLE_PROJECT_ID,
    });

    this.ttsClient = new TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
      },
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
  }

  async textToSpeech(text: string) {
    await this.getAuthenticatedClients();
    // const request = {
    //   input: { text },
    //   voice: {
    //     languageCode: "en-US",
    //     name: "en-US-Neural2-F",
    //     ssmlGender: "FEMALE",
    //   },
    //   audioConfig: {
    //     audioEncoding: "MP3",
    //     speakingRate: 1.0,
    //     pitch: 0,
    //   },
    // };

    const [response] = await this.ttsClient.synthesizeSpeech({
      input: { text },
    });
    return response.audioContent;
  }

  async streamTextToSpeech(text: string) {
    await this.getAuthenticatedClients();
    const chunks: Buffer[] = [];
    const audioStream = new PassThrough();

    // const request = {
    //   input: { text },
    //   voice: {
    //     languageCode: "en-US",
    //     name: "en-US-Neural2-F",
    //     ssmlGender: "FEMALE",
    //   },
    //   audioConfig: {
    //     audioEncoding: "MP3",
    //     speakingRate: 1.0,
    //     pitch: 0,
    //   },
    // };

    const [response] = await this.ttsClient.synthesizeSpeech({
      input: { text },
    });
    console.log("🚀 ~ file: speechService.ts:123 ~ response:", response);
    if (response.audioContent) {
      // Split the audio into smaller chunks
      const chunkSize = 4096;
      const audioContent = response.audioContent as Buffer;

      for (let i = 0; i < audioContent.length; i += chunkSize) {
        const chunk = audioContent.slice(i, i + chunkSize);
        chunks.push(chunk);
      }

      // Stream the chunks
      chunks.forEach((chunk) => audioStream.write(chunk));
      audioStream.end();
    }

    return audioStream;
  }
}
