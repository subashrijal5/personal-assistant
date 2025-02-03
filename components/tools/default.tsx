import { ToolInvocation } from "ai";
import { Brain } from "lucide-react";

const loadingMessages = [
  "Analyzing data...",
  "Processing your request...",
  "Thinking...",
  "Computing results...",
  "Working on it...",
  "Almost there...",
];

export default function DefaultTool({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  // Get a random message but keep it consistent for this instance
  const loadingMessage = loadingMessages[Math.floor(toolInvocation.toolName.length % loadingMessages.length)];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Brain className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          {toolInvocation.state !== "result" && (
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {toolInvocation.toolName.split(/(?=[A-Z])/).join(" ")}
        </h3>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex space-x-1">
          {toolInvocation.state !== "result" && [
            "bg-blue-500",
            "bg-blue-400",
            "bg-blue-300",
          ].map((color, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${color} animate-bounce`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {toolInvocation.state === "result" ? "Done!" : loadingMessage}
        </p>
      </div>
    </div>
  );
}