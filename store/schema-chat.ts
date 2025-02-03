import { create } from 'zustand'
import { Message } from '@/app/actions/generate-schema'

interface SchemaChatState {
  chatHistory: Message[]
  addMessage: (message: Message) => void
  setChatHistory: (history: Message[]) => void
  clearHistory: () => void
}

export const useSchemaChatStore = create<SchemaChatState>((set) => ({
  chatHistory: [],
  addMessage: (message) => set((state) => ({ 
    chatHistory: [...state.chatHistory, message] 
  })),
  setChatHistory: (history) => set({ chatHistory: history }),
  clearHistory: () => set({ chatHistory: [] }),
}))
