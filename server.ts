import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected");
    const refreshToken = socket.handshake.auth.refreshToken;
    if (!refreshToken) {
      console.error("No refresh token provided");
      socket.disconnect();
      return;
    }

    socket.on("speakLLMResponse", async ({ text }: { text: string }) => {
      try {
        const { SpeechService } = await import("./lib/server/ttsService.js");
        const ttsService = new SpeechService(refreshToken);
        const audioStream = await ttsService.streamTextToSpeech(text);

        const chunks: Buffer[] = [];

        audioStream.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        audioStream.on("end", () => {
          const fullAudioBuffer = Buffer.concat(chunks);
          socket.emit("ttsAudio", fullAudioBuffer.buffer);
        });

        audioStream.on("error", (error) => {
          console.error("TTS Stream error:", error);
          socket.emit("ttsError", error.message);
        });
      } catch (error) {
        console.error("TTS error:", error);
        socket.emit("ttsError", (error as Error).message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
