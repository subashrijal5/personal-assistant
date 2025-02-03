import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message } from 'ai';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatStore {
  chats: Chat[];
  activeChat: string | null;
  initialized: boolean;
  createChat: () => void;
  deleteChat: (id: string) => void;
  setActiveChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  initialize: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChat: null,
      initialized: false,

      initialize: () => {
        const state = get();
        if (!state.initialized && state.chats.length === 0) {
          const newChat = {
            id: crypto.randomUUID(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set({
            chats: [newChat],
            activeChat: newChat.id,
            initialized: true,
          });
        }
      },

      createChat: () => {
        const newChat = {
          id: crypto.randomUUID(),
          title: 'New Chat',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChat: newChat.id,
        }));
      },

      deleteChat: (id) => {
        set((state) => {
          const newChats = state.chats.filter((chat) => chat.id !== id);
          const newActiveChat = state.activeChat === id ? newChats[0]?.id || null : state.activeChat;

          return {
            chats: newChats,
            activeChat: newActiveChat,
          };
        });
      },

      setActiveChat: (id) => {
        set({ activeChat: id });
      },

      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updatedAt: new Date().toISOString(),
                  title:
                    chat.messages.length === 0
                      ? message.content.slice(0, 30) + '...'
                      : chat.title,
                }
              : chat
          ),
        }));
      },

      updateChatTitle: (chatId, title) => {
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  title,
                }
              : chat
          ),
        }));
      },
    }),
    {
      name: 'chat-store',
      version: 1,
    }
  )
);
