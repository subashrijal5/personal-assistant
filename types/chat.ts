import { Message } from 'ai';

export interface ChatMessageProps {
  message: Message;

}

export interface ChatInputProps {
  input: string;
  isLoading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export interface ChatHeaderProps {
  title: string;
  subtitle: string;
}

export interface ChatContainerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}
