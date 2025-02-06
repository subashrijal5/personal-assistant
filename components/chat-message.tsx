import { Bot, User } from "lucide-react";
import { motion } from "framer-motion";
import Markdown from "react-markdown";
import { ChatMessageProps } from "@/types/chat";
import ListDateMessage from "./tools/list-date-message";
import { ToolInvocation } from "ai";
import DefaultTool from "./tools/default";
import MeetingCreateSuccess from "./tools/meeting-create-success";
import ReadEmail from "./tools/read-email";
import Task from "./tools/task";
import Doc from "./tools/doc";
import AnalyseDocument from "./tools/analyse-document";
import ListEvents from "./tools/search-results";
import SearchResults from "./tools/search-results";

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const getComponentByTool = (toolInvocation: ToolInvocation) => {
    switch (toolInvocation.toolName) {
      case "getAvailability":
        return <ListDateMessage toolInvocation={toolInvocation} />;
      case "createCalendarEvent":
        return <MeetingCreateSuccess toolInvocation={toolInvocation} />;
      case "readEmails":
        return <ReadEmail toolInvocation={toolInvocation} />;
      case "createTask":
      case "listTasks":
      case "createTaskList":
      case "updateTaskStatus":
        return <Task toolInvocation={toolInvocation} />;
      case "createDoc":
      case "listDocs":
        return <Doc toolInvocation={toolInvocation} />;
      case "getDocContent":
        return <AnalyseDocument toolInvocation={toolInvocation} />;
      case "listEvents":
        return <ListEvents toolInvocation={toolInvocation} />;
      case "searchWeb":
        return <SearchResults toolInvocation={toolInvocation} />;
      default:
        return <DefaultTool toolInvocation={toolInvocation} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 px-4"
    >
      <div
        className={`w-8 h-8 rounded-lg flex-shrink-0 ${
          isUser ? "bg-zinc-700" : "bg-black dark:bg-white/10"
        } flex items-center justify-center`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className=" overflow-y-auto max-h-80 mb-4">
            {message.toolInvocations.map((toolInvocation) => (
              <div key={toolInvocation.toolCallId}>
                {getComponentByTool(toolInvocation)}
              </div>
            ))}
          </div>
        )}
        <Markdown
          className="prose dark:prose-invert prose-zinc prose-p:leading-7 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 max-w-none"
          components={{
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="text-black dark:text-white underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            p: ({ node, ...props }) => (
              <p {...props} className="mt-0 mb-4 last:mb-0" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ul: ({ node, ...props }) => (
              <ul {...props} className="mt-4 mb-6 list-disc pl-4" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ol: ({ node, ...props }) => (
              <ol {...props} className="mt-4 mb-6 list-decimal pl-4" />
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            code: ({ node, className, ...props }) => (
              <code
                {...props}
                className={`${className} bg-zinc-100 dark:bg-zinc-900 text-zinc-800 px-1.5 py-0.5 rounded text-sm`}
              />
            ),
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            pre: ({ node, ...props }) => (
              <pre
                {...props}
                className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 overflow-x-auto my-4 text-sm"
              />
            ),
          }}
        >
          {message.content}
        </Markdown>
      </div>
    </motion.div>
  );
}
