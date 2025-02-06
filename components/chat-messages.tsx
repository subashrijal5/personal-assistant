import { Message } from "ai";
import { Loader2 } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { motion } from "framer-motion";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800"
    >
      {messages.map((message) => (
        <div
          key={message.id}
          className={`w-full ${
            message.role === "assistant"
              ? "bg-zinc-50 dark:bg-zinc-900/50"
              : "bg-white dark:bg-black"
          }`}
        >
          <div className="max-w-4xl mx-auto py-4">
            <ChatMessage message={message} />
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="w-full bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-4xl mx-auto py-4">
            <div className="flex items-center gap-4 px-4">
              <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-black dark:text-white animate-spin" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-52 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-72 bg-black/10 dark:bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
