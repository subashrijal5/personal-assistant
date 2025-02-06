"use client";

import { useEffect, useState, useRef } from "react";
import { getSocket } from "@/lib/socketClient";
import { Socket } from "socket.io-client";

export default function TestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [audioStatus, setAudioStatus] = useState("");
  const audioContextRef = useRef<AudioContext| undefined>(undefined);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const playNextChunk = async () => {
    if (
      !audioQueueRef.current.length ||
      !audioContextRef.current ||
      isPlayingRef.current
    ) {
      return;
    }

    try {
      isPlayingRef.current = true;
      const chunk = audioQueueRef.current.shift()!;
      const audioBuffer = await audioContextRef.current.decodeAudioData(chunk);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        isPlayingRef.current = false;
        playNextChunk(); // Play next chunk when current one ends
      };

      source.start(0);
    } catch (error) {
      console.error("Error playing audio chunk:", error);
      isPlayingRef.current = false;
      setAudioStatus("Error playing audio");
    }
  };

  useEffect(() => {
    let socket: Socket;

    const initSocket = async () => {
      try {
        socket = await getSocket();
        console.log("🚀 ~ file: page.tsx:12 ~ socket:", socket);

        socket.on("connect", () => {
          console.log("Connected to server");
          setIsConnected(true);
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from server");
          setIsConnected(false);
        });

        socket.on("ttsAudio", (chunk: ArrayBuffer) => {
          setAudioStatus("Receiving audio chunk...");

          try {
            // Initialize AudioContext if not already done
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext ||
                window.webkitAudioContext)();
            }

            // Add chunk to queue
            audioQueueRef.current.push(chunk);

            // Try to play next chunk
            playNextChunk();
          } catch (error) {
            console.error("Error processing audio chunk:", error);
            setAudioStatus("Error processing audio");
          }
        });

        socket.on("ttsEnd", () => {
          setAudioStatus("Audio stream ended");
          // Don't close the context immediately, wait for all chunks to play
          const checkQueue = setInterval(() => {
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
              if (audioContextRef.current?.state !== "closed") {
                audioContextRef.current?.close();
              }
              audioContextRef.current = undefined;
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              clearInterval(checkQueue);
            }
          }, 100);
        });

        socket.on("ttsError", (error) => {
          setAudioStatus(`Error: ${error}`);
        });
      } catch (error) {
        console.error("Socket initialization error:", error);
        setIsConnected(false);
        setAudioStatus("Failed to connect to server");
      }
    };

    initSocket();

    return () => {
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("ttsAudio");
        socket.off("ttsEnd");
        socket.off("ttsError");
      }
      // Clean up audio context on unmount
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const testTTS = async () => {
    try {
      const socket = await getSocket();
      socket.emit("speakLLMResponse", {
        text: "Hello, this is a test message!",
      });
      setAudioStatus("Starting TTS...");
    } catch (error) {
      console.error("Error in TTS test:", error);
      setAudioStatus("Failed to start TTS");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Socket.IO Test Page</h1>
      <div className="mb-4">
        <p>Connection Status: {isConnected ? "Connected" : "Disconnected"}</p>
        <p>Audio Status: {audioStatus}</p>
      </div>
      <button
        onClick={testTTS}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Test Text-to-Speech
      </button>
    </div>
  );
}
