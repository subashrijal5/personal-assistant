import { ToolInvocation } from "ai";
import { Calendar } from "lucide-react";

export default function DefaultTool({ toolInvocation }: { toolInvocation: ToolInvocation }) {
    console.log("🚀 ~ file: default.tsx:5 ~ toolInvocation:", toolInvocation)
    
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {toolInvocation.toolName}
        </h3>
      </div>
      {/* <p className="text-zinc-500 dark:text-zinc-400">
        {toolInvocation.state === "result" ? toolInvocation.result : "Loading..."}
      </p> */}
      <p className="text-zinc-500 dark:text-zinc-400">
        {toolInvocation.state === "result" ? JSON.stringify(toolInvocation.result) : "Loading..."}
      </p>
    </div>
  );
}