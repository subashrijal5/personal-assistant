import { motion } from 'framer-motion';
import { CalendarIcon, Mail, FileText, MapPin } from 'lucide-react';
import { useLocale } from 'next-intl';

interface ExampleQuestion {
  title: string;
  subtitle: string;
  titleJa: string;
  subtitleJa: string;
  icon: React.ReactNode;
}

interface ChatExamplesProps {
  onSelectQuestion: (question: string) => void;
  language?: 'en' | 'ja';
}

const EXAMPLE_QUESTIONS: ExampleQuestion[] = [
  {
    title: "Get my daily overview",
    subtitle: "Summary of events, tasks, and emails",
    titleJa: "今日の予定を確認",
    subtitleJa: "予定、タスク、メールの概要",
    icon: <CalendarIcon className="w-4 h-4" />
  },
  {
    title: "Check my recent emails",
    subtitle: "Read and summarize new messages",
    titleJa: "最近のメールを確認",
    subtitleJa: "新着メールの要約を表示",
    icon: <Mail className="w-4 h-4" />
  },
  {
    title: "Create a document about Gemini",
    subtitle: "Write about its superpowers and capabilities",
    titleJa: "Geminiについての文書を作成",
    subtitleJa: "その超能力と機能について書く",
    icon: <FileText className="w-4 h-4" />
  },
  {
    title: "Find Nepali restaurants in Tokyo",
    subtitle: "Discover nearby dining options",
    titleJa: "東京のネパール料理店を探す",
    subtitleJa: "近くの飲食店を見つける",
    icon: <MapPin className="w-4 h-4" />
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function ChatExamples({ onSelectQuestion,  }: ChatExamplesProps) {
  const language = useLocale();
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto px-4"
    >
      {EXAMPLE_QUESTIONS.map((question) => (
        <motion.button
          key={question.title}
          variants={item}
          onClick={() => onSelectQuestion(`${language === 'ja' ? question.titleJa : question.title}`)}
          className="group relative flex flex-col gap-2 rounded-2xl border border-zinc-200 p-6 text-left transition-colors hover:border-zinc-800 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white group-hover:border-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-zinc-600">
              {question.icon}
            </div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-200">
              {language === 'ja' ? question.titleJa : question.title}
            </h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-11">
            {language === 'ja' ? question.subtitleJa : question.subtitle}
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
}
