'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import { Bot } from 'lucide-react';
import { ChatContainer } from './chat-container';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-4 bg-primary rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        aria-label="Toggle chat"
      >
        <Bot className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      <ChatContainer isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ChatHeader 
          title="Makai Bot"
          subtitle="Your personal portfolio assistant"
        />
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput
          input={input}
          isLoading={isLoading}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </ChatContainer>
    </>
  );
}
