import { useCallback, useEffect, useRef } from "react";

export function useAudioStream() {
  const audioContextRef = useRef<AudioContext | undefined>(undefined);

  const playTTSAudio = useCallback(async (audioData: ArrayBuffer) => {
    try {
      // Create or get AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      // Ensure context is running
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Convert the entire audio buffer to Int16Array
      const int16Array = new Int16Array(audioData);
      const float32Array = new Float32Array(int16Array.length);

      // Convert to float32 (-1 to 1 range)
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        float32Array.length,
        audioContextRef.current.sampleRate
      );
      audioBuffer.getChannelData(0).set(float32Array);

      // Create and play source
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);

      // Clean up when done
      source.onended = () => {
        source.disconnect();
      };
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }, []);

  const stopTTS = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTTS();
    };
  }, [stopTTS]);

  return { playTTSAudio, stopTTS };
}
