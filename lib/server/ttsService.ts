import { PassThrough } from "node:stream";
import { validateAndRefreshToken, getGoogleServices } from "./google-auth.js";

type ReplacementRule = {
  pattern: RegExp;
  replacement: string | ((match: string, ...args: string[]) => string);
};

export class SpeechService {
  constructor(private refreshToken?: string, private language?: string) {}

  private async getAuthenticatedServices() {
    if (!this.refreshToken) {
      throw new Error("No refresh token provided. Please authenticate first.");
    }

    const { client } = await validateAndRefreshToken(this.refreshToken);
    if (!client) throw new Error("Failed to get OAuth client");

    return getGoogleServices(client);
  }

  // async streamTextToSpeech(text: string) {
  //   const services = await this.getAuthenticatedServices();

  //   const request = {
  //     input: { text },
  //     voice: {
  //       languageCode: "en-US",
  //       name: "en-US-Neural2-D",
  //       // ssmlGender: "NEUTRAL",
  //     },
  //     audioConfig: {
  //       audioEncoding: "LINEAR16",
  //       sampleRateHertz: 48000,
  //       channelCount: 1, // mono
  //     },
  //   };

  //   const response = await services.texttospeech.text.synthesize({
  //     requestBody: request
  //   });

  //   if (!response.data.audioContent) {
  //     throw new Error('No audio content received');
  //   }

  //   const audioStream = new PassThrough();
  //   const audioContent = Buffer.from(response.data.audioContent, 'base64');

  //   // Split the audio into smaller chunks for streaming
  //   const chunkSize = 4096;
  //   for (let i = 0; i < audioContent.length; i += chunkSize) {
  //     const chunk = audioContent.slice(i, i + chunkSize);
  //     audioStream.write(chunk);
  //   }
  //   audioStream.end();

  //   return audioStream;
  // }

  async streamTextToSpeech(text: string) {
    const services = await this.getAuthenticatedServices();
    const japaneseVoice = {
      languageCode: "ja-JP",
      name: "ja-JP-Wavenet-A",
    };
    const englishVoice = {
      languageCode: "en-US",
      name: "en-US-Neural2-D",
    };
    const request = {
      input: { text: this.markdownToTTS(text) },
      voice: this.language === "ja" ? japaneseVoice : englishVoice,
      audioConfig: {
        audioEncoding: "LINEAR16",
        sampleRateHertz: 24000,
      },
    };

    const response = await services.texttospeech.text.synthesize({
      requestBody: request,
    });

    if (!response.data.audioContent) {
      throw new Error("No audio content received");
    }

    if (!response.data.audioContent) {
      throw new Error("No audio content received");
    }

    // Get full audio content at once
    const audioContent = Buffer.from(response.data.audioContent, "base64");

    // Create stream
    const audioStream = new PassThrough();
    audioStream.write(audioContent);
    audioStream.end();

    return audioStream;

    // const audioContent = Buffer.from(response.data.audioContent, "base64");
    // const audioStream = new PassThrough();

    // // Stream in smaller chunks (4KB)
    // const chunkSize = 4096;
    // let offset = 0;

    // const streamChunk = () => {
    //   if (offset >= audioContent.length) {
    //     audioStream.end();
    //     return;
    //   }

    //   const chunk = audioContent.slice(offset, offset + chunkSize);
    //   audioStream.write(chunk);
    //   offset += chunkSize;

    //   // Schedule next chunk with a small delay for smoother streaming
    //   setTimeout(streamChunk, 50);
    // };

    // streamChunk();
    // return audioStream;
  }

  async streamSpeechToText(audioBuffer: Buffer) {
    const services = await this.getAuthenticatedServices();

    const request = {
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 16000,
        languageCode: "en-US",
        // model: "latest_long",
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioBuffer.toString("base64"),
      },
    };

    const response = await services.speech.speech.recognize({
      requestBody: request,
    });

    if (!response.data.results) {
      throw new Error("No transcription results received");
    }

    return response.data.results
      .map((result) => result.alternatives?.[0]?.transcript || "")
      .join(" ");
  }

  markdownToTTS(markdown: string): string {
    // Remove any leading/trailing whitespace
    let text = markdown.trim();

    const rules: ReplacementRule[] = [
      // Headers - replace #, ##, etc. with period and space
      {
        pattern: /^#{1,6}\s+(.+)$/gm,
        replacement: "$1. ",
      },

      // Bold and Italic - remove ** and * and _
      {
        pattern: /(\*\*|__)(.*?)\1/g,
        replacement: "$2",
      },
      {
        pattern: /(\*|_)(.*?)\1/g,
        replacement: "$2",
      },

      // Links - extract text content only
      // {
      //   pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
      //   replacement: "$1",
      // },
      // remove links completely
      {
        pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
        replacement: "",
      },

      // Lists - replace bullets with comma and space
      {
        pattern: /^\s*[-*+]\s+(.+)$/gm,
        replacement: "$1, ",
      },

      // Numbered lists - replace numbers with comma and space
      {
        pattern: /^\s*\d+\.\s+(.+)$/gm,
        replacement: "$1, ",
      },

      // Code blocks - remove backticks and add "code:" prefix
      {
        pattern: /```[\s\S]*?```/g,
        replacement: (match) => {
          const code = match
            .replace(/```(?:\w+)?\n([\s\S]*?)```/g, "$1")
            .trim();
          return `Code: ${code}. `;
        },
      },

      // Inline code - remove backticks
      {
        pattern: /`([^`]+)`/g,
        replacement: "$1",
      },

      // Blockquotes - remove > and add "quote:"
      {
        pattern: /^\s*>\s+(.+)$/gm,
        replacement: "Quote: $1. ",
      },

      // Horizontal rules - replace with pause
      {
        pattern: /^\s*[-*_]{3,}\s*$/gm,
        replacement: ". ",
      },

      // Tables - convert to readable format
      {
        pattern: /\|(.+)\|/g,
        replacement: (match) => {
          return match
            .split("|")
            .filter((cell) => cell.trim())
            .join(", ");
        },
      },

      // Clean up multiple spaces
      {
        pattern: /\s+/g,
        replacement: " ",
      },

      // Clean up multiple periods
      {
        pattern: /\.{2,}/g,
        replacement: ".",
      },

      // Clean up comma space period
      {
        pattern: /,\s*\./g,
        replacement: ".",
      },
    ];

    // Apply all replacement rules
    rules.forEach((rule) => {
      text = text.replace(rule.pattern, rule.replacement  as string);
    });

    // Final cleanup
    return text
      .trim()
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Normalize spaces
      .replace(/\s+\./g, ".") // Clean up spaces before periods
      .replace(/,\s*$/g, "."); // Replace trailing comma with period
  }
}
