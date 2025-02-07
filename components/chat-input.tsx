import { motion } from "framer-motion";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mic } from "lucide-react";
import { useChatContext } from "./chat-context";

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

export function ChatInput() {
  const { setInput, handleSubmit, input } = useChatContext();
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
    }
  }, [input, handleSubmit]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

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

      setInput(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log("Speech recognition ended");
    };

    recognition.onerror = (event: Event & { error: string }) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
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
  }, [locale, setInput, submitInput, isRecording]);

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
        setIsRecording(false);
        if (input.trim()) {
          submitInput();
          setTimeout(() => {
            setInput("");
          }, 500);
        }
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    } else {
      setInput("");
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start recording:", error);
        setIsRecording(false);
      }
    }
  }, [isRecording, input, submitInput, setInput]);

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
                setInput(e.target.value);
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
                  if (input.trim())
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                }
              }}
            />

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
          </div>
        </form>
      </motion.div>
    </div>
  );
}
