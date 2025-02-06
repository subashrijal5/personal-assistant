"use client";

import {
  Plus,
  PanelLeftClose,
  PanelLeft,
  Edit2,
  Trash2,
  Bot,
  MessageSquare,
} from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChatInput } from "./chat-input";
import { format } from "date-fns";
import { ChatExamples } from "./chat-examples";
import { ChatMessage } from "./chat-message";
import { useChatContext } from "./chat-context";
import { useChatStore } from "@/store/chat-store";
import { v4 as uuid } from "uuid";

export function FullPageChat() {
  const t = useTranslations("chat");
  const {
    chats,
    activeChat,
    createChat,
    deleteChat,
    setActiveChat,
    addMessage,
  } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChatContext();

  // Auto-scroll to bottom when messages change or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    "mod+b": {
      handler: () => setIsSidebarOpen((prev) => !prev),
      description: "Toggle sidebar",
    },
    "mod+shift+a": {
      handler: createChat,
      description: "Create new chat",
    },
    "mod+shift+backspace": {
      handler: () => {
        if (activeChat) {
          deleteChat(activeChat);
        }
      },
      description: "Delete current chat",
    },
  });

  const handleTitleUpdate = (chatId: string) => {
    if (editTitle.trim()) {
      useChatStore.getState().updateChatTitle(chatId, editTitle);
    }
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleExampleSelect = (question: string) => {
    setInput(question);
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  return (
    <div className="h-[100dvh] flex relative bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full overflow-hidden flex flex-col fixed left-0 top-0 bottom-0 z-40 pt-14"
          >
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={createChat}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black p-2.5 text-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  {t("newChat")}
                </button>
              </div>
              <div className="px-2 py-3 space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group rounded-lg transition-colors ${
                      activeChat === chat.id
                        ? "bg-zinc-100 dark:bg-zinc-800"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div
                      onClick={() => setActiveChat(chat.id)}
                      className="w-full text-left p-3 flex items-start gap-3 cursor-pointer"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingChatId === chat.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleTitleUpdate(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleTitleUpdate(chat.id);
                              }
                              e.stopPropagation();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-transparent border-none p-0 focus:outline-none text-sm font-medium"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {chat.title}
                            </span>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(chat.id);
                                setEditTitle(chat.title);
                              }}
                              className="opacity-0 group-hover:opacity-100 hover:text-blue-500 p-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {format(new Date(chat.updatedAt), "MMM d, h:mm a")}
                          </span>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isSidebarOpen ? "pl-80" : "pl-0"
        } transition-[padding] duration-300`}
      >
        {/* Header */}
        <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium group"
              title={
                isSidebarOpen
                  ? t("sidebar.toggleClose")
                  : t("sidebar.toggleOpen")
              }
            >
              {isSidebarOpen ? (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <kbd className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium text-zinc-400 dark:text-zinc-600 ml-1">
                    ⌘+B
                  </kbd>
                </>
              ) : (
                <>
                  <PanelLeft className="w-4 h-4" />
                  <kbd className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium text-zinc-400 dark:text-zinc-600 ml-1">
                    ⌘+Bx
                  </kbd>
                </>
              )}
            </button>
            {activeChat && (
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                <span className="truncate">
                  {chats.find((chat) => chat.id === activeChat)?.title}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createChat}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline-block whitespace-nowrap">
                {t("newChat")}
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 text-[13px] font-medium text-zinc-400 dark:text-zinc-600 ml-1">
                ⌘+shift+a
              </kbd>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <div className="h-full">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-8"
                >
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    {/* <Bot className="w-8 h-8 text-black dark:text-white" /> */}
                    <svg
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"
                        fill="url(#prefix__paint0_radial_980_20147)"
                      />
                      <defs>
                        <radialGradient
                          id="prefix__paint0_radial_980_20147"
                          cx="0"
                          cy="0"
                          r="1"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="matrix(16.1326 5.4553 -43.70045 129.2322 1.588 6.503)"
                        >
                          <stop offset=".067" stop-color="#9168C0" />
                          <stop offset=".343" stop-color="#5684D1" />
                          <stop offset=".672" stop-color="#1BA1E3" />
                        </radialGradient>
                      </defs>
                    </svg>
                  </div>
                  <h1 className="text-2xl font-semibold text-black dark:text-white mb-3">
                    {t("welcome.title")}
                  </h1>
                  <p className="text-zinc-500 dark:text-zinc-400 text-base max-w-md mx-auto">
                    {t("welcome.description")}
                  </p>
                </motion.div>
                <ChatExamples onSelectQuestion={handleExampleSelect} />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto p-4">
                <div className="space-y-6">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center justify-center">
                      <Bot className="w-6 h-6 animate-bounce" />
                    </div>
                  )}
                  {/* Invisible element for auto-scrolling */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Input */}
        <div className="sticky bottom-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto py-2">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={(e) => {
                handleSubmit(e);
                addMessage(activeChat!, {
                  role: "user",
                  content: input,
                  id: uuid(),
                });
              }}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
