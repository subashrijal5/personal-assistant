"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useChat, UseChatHelpers } from "ai/react";
import { useChatStore } from "@/store/chat-store";
import { Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
// import { getSocket } from "@/lib/socketClient";
// import { useAudioStream } from "@/hooks/useAudioStream";

interface ChatContextType extends UseChatHelpers {
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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
  const { chats, activeChat, addMessage, initialize } = useChatStore();
  // const { playTTSAudio, stopTTS } = useAudioStream();
  const [socket, setSocket] = useState<Socket | null>(null);
  const currentChat = chats.find((chat) => chat.id === activeChat);

  // Initialize socket connection
  useEffect(() => {
    // const initSocket = async () => {
    //   try {
    //     const newSocket = await getSocket();
    //     setSocket(newSocket);

    //     newSocket.on("connect", () => {
    //       console.log("Connected to server");
    //     });

    //     newSocket.on("disconnect", () => {
    //       console.log("Disconnected from server");
    //     });

    //     newSocket.on("ttsAudio", playTTSAudio);
    //     newSocket.on("ttsEnd", stopTTS);
    //     newSocket.on("ttsError", (error) => {
    //       console.error("TTS Error:", error);
    //     });

    //     return newSocket;
    //   } catch (error) {
    //     console.error("Socket initialization error:", error);
    //     return null;
    //   }
    // };

    // initSocket();
    initialize();

    // return () => {
    //   if (socket) {
    //     socket.off("connect");
    //     socket.off("disconnect");
    //     socket.off("ttsAudio");
    //     socket.off("ttsEnd");
    //     socket.off("ttsError");
    //     socket.disconnect();
    //   }
    // };
  }, []);

  const chat = useChat({
    id: activeChat || undefined,
    initialMessages: currentChat?.messages || [],
    onFinish: (message) => {
      console.log("🚀 ~ file: chat-context.tsx:89 ~ message:", message);
      if (activeChat) {
        addMessage(activeChat, message);
        if (!socket) return;
        socket.emit("speakLLMResponse", {
          text: message.content,
        });
      }
    },
    onError: (error) => {
      if (activeChat) {
        addMessage(activeChat, {
          id: uuidv4(),
          role: "assistant",
          content: "Sorry, Some error occurred. Please try again later.",
        });
      }
      console.error("Chat error:", error);
    },
  });

  return (
    <ChatContext.Provider value={{ ...chat, socket, setSocket }}>
      {children}
    </ChatContext.Provider>
  );
};
