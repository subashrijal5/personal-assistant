"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useChat, UseChatHelpers } from "ai/react";
import { useChatStore } from "@/store/chat-store";

const ChatContext = createContext<UseChatHelpers | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { chats, activeChat, addMessage } = useChatStore();
  const currentChat = chats.find((chat) => chat.id === activeChat);

  const chat = useChat({
    id: activeChat || undefined,
    initialMessages: currentChat?.messages || [],
    onFinish: (message) => {
      if (activeChat) {
        addMessage(activeChat, message);
      }
    },
  });

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};
