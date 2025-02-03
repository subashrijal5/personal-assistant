import { Send } from 'lucide-react';
import { ChatInputProps } from '@/types/chat';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

export function ChatInput({ input, isLoading, handleInputChange, handleSubmit }: ChatInputProps) {
  const t = useTranslations('chat');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    };

    adjustHeight();
    return () => {
      textarea.style.height = 'auto';
    };
  }, [input]);

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
          className="flex items-start gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white/50 px-4 py-3.5 text-base leading-relaxed placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-0 dark:border-zinc-800 dark:bg-zinc-900/50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-700"
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                // Ensure the textarea height is adjusted after content change
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 400)}px`;
                }
              }}
              placeholder={t('input.placeholder')}
              rows={1}
              style={{ minHeight: '56px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSubmit(e as any);
                  }
                }
              }}
            />
          </div>
        </form>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] text-center text-zinc-400 dark:text-zinc-600 mt-1.5"
        >
          {t('input.hint')}
        </motion.p>
      </motion.div>
    </div>
  );
}
