import { Message } from 'ai';

export interface ChatMessageProps {
  message: Message;

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
