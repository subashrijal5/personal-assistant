import { ChatInputProps } from "@/types/chat";
import { motion } from "framer-motion";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mic } from "lucide-react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  emma?: Document;
  interpretation?: any;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror:
    | ((this: SpeechRecognition, ev: Event & { error: string }) => any)
    | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  serviceURI: string;
  abort(): void;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isVoiceMode = true,
}: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("chat");
  const locale = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Submit current input
  const submitInput = useCallback(() => {
    if (input.trim()) {
      handleSubmit({} as FormEvent<HTMLFormElement>);
      handleInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, [input, handleSubmit, handleInputChange]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined" || !isVoiceMode) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = locale;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const transcript = results
        .map((result) => result[0].transcript)
        .join(" ");

      console.log("Transcript:", transcript);
      handleInputChange({
        target: { value: transcript },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      // Restart recognition if it was stopped unexpectedly
      if (isRecording) {
        try {
          recognition.start();
        } catch (error) {
          console.error("Failed to restart recording:", error);
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      console.error("Speech recognition error:", event.error);
      // Only stop on critical errors
      if (event.error !== "no-speech") {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  }, [isVoiceMode, locale, handleInputChange, submitInput, isRecording]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    };

    adjustHeight();
    return () => {
      textarea.style.height = "auto";
    };
  }, [input]);

  const toggleRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      try {
        recognitionRef.current.stop();
        if (input.trim()) {
          submitInput();
        }
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    } else {
      handleInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);

      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recording:", error);
        setIsRecording(false);
      }
    }
  }, [isRecording, input, submitInput, handleInputChange]);

  return (
    <div className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) handleSubmit(e);
          }}
          ref={formRef}
          className="flex items-start gap-2"
        >
          <div className="relative flex-1 flex items-center gap-2">
            <textarea
              ref={textareaRef}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white/50 px-4 py-3.5 text-base leading-relaxed placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0 dark:border-zinc-800 dark:bg-zinc-900/50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700"
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                // Ensure the textarea height is adjusted after content change
                if (textareaRef.current) {
                  textareaRef.current.style.height = "auto";
                  textareaRef.current.style.height = `${Math.min(
                    textareaRef.current.scrollHeight,
                    400
                  )}px`;
                }
              }}
              placeholder={t("input.placeholder")}
              rows={1}
              style={{ minHeight: "56px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) handleSubmit(e);
                }
              }}
            />
            {isVoiceMode && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
