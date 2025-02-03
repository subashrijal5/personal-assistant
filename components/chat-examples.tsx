import { motion } from 'framer-motion';
import { BriefcaseIcon, CalendarIcon, CodeIcon, UserIcon } from 'lucide-react';

interface ExampleQuestion {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface ChatExamplesProps {
  onSelectQuestion: (question: string) => void;
}

const EXAMPLE_QUESTIONS: ExampleQuestion[] = [
  {
    title: "Tell me about your experience",
    subtitle: "Learn about my background and skills",
    icon: <UserIcon className="w-4 h-4" />
  },
  {
    title: "What projects have you worked on?",
    subtitle: "Discover my portfolio projects",
    icon: <BriefcaseIcon className="w-4 h-4" />
  },
  {
    title: "How can we schedule a meeting?",
    subtitle: "Let's discuss potential collaboration",
    icon: <CalendarIcon className="w-4 h-4" />
  },
  {
    title: "What are your technical skills?",
    subtitle: "Learn about my tech stack and expertise",
    icon: <CodeIcon className="w-4 h-4" />
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

export function ChatExamples({ onSelectQuestion }: ChatExamplesProps) {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4"
    >
      {EXAMPLE_QUESTIONS.map((question) => (
        <motion.button
          key={question.title}
          variants={item}
          onClick={() => onSelectQuestion(question.title)}
          className="group relative flex flex-col gap-2 rounded-2xl border border-zinc-200 p-6 text-left transition-colors hover:border-zinc-800 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white group-hover:border-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-zinc-600">
              {question.icon}
            </div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-200">
              {question.title}
            </h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-11">
            {question.subtitle}
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
}
