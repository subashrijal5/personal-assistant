import { ToolInvocation } from "ai";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const loadingStates = [
  "analyzing",
  "processing",
  "thinking",
  "generating",
  "searching",
] as const;

export default function DefaultTool({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const t = useTranslations("tools.status");
  const loadingState = loadingStates[Math.floor(toolInvocation.toolName.length % loadingStates.length)];
  const loadingMessage = t(loadingState);

  return (
    <div className="w-full py-2">
    <div className="relative w-full bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-900/20 rounded-xl overflow-hidden  border border-blue-100/50 dark:border-blue-500/10">
      {/* Background grid effect */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBoLTQweiIvPjxwYXRoIGQ9Ik00MCAyMGgtNDBtMjAtMjB2NDAiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L2c+PC9zdmc+')] opacity-50 dark:opacity-20" />
      
      {/* Content container */}
      <div className="relative px-4 py-3">
        <div className="flex items-center gap-3">
          {toolInvocation.state !== "result" ? (
            <>
              {/* AI Processing animation */}
              <div className="flex items-center gap-3">
                <div className="relative flex h-8 w-8">
                  {/* Circular pulse */}
                  <div className="absolute inset-0 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 animate-ping" />
                  
                  {/* Rotating circles */}
                  <div className="relative w-full h-full">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-indigo-500/30 dark:border-indigo-400/40"
                        style={{
                          animation: `spin ${2 + i}s linear infinite`,
                          borderLeftColor: 'transparent',
                          borderBottomColor: 'transparent',
                          transform: `rotate(${120 * i}deg)`
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Center dot */}
                  <div className="absolute inset-[30%] rounded-full bg-indigo-500 dark:bg-indigo-400 animate-pulse" />
                </div>

                {/* Loading message */}
                <div className="relative">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 tracking-wide">
                    {loadingMessage}
                  </div>
                  {/* Animated underline */}
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent animate-scan" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success animation */}
              <div className="flex items-center gap-3">
                <div className="relative h-8 w-8">
                  {/* Success ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-teal-500 dark:border-teal-400 animate-success-ring" />
                  
                  {/* Checkmark */}
                  <Check
                    className="absolute inset-0 w-8 h-8 text-teal-500 dark:text-teal-400 animate-success-check"
                  />
                </div>

                {/* Success message */}
                <div className="text-sm font-medium text-teal-600 dark:text-teal-400 tracking-wide animate-success-text">
                  {t('done')}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ambient light effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-indigo-100/20 dark:from-indigo-500/5 to-transparent pointer-events-none" />
    </div>

    <style jsx>{`
      @keyframes scan {
        0%, 100% { transform: translateX(-100%); opacity: 0; }
        50% { transform: translateX(0); opacity: 1; }
      }
      @keyframes success-ring {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes success-check {
        0% { stroke-dashoffset: 24; opacity: 0; }
        60% { stroke-dashoffset: 24; opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      @keyframes success-text {
        0% { transform: translateY(10px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      .animate-scan {
        animation: scan 2s ease-in-out infinite;
      }
      .animate-success-ring {
        animation: success-ring 0.4s ease-out forwards;
      }
      .animate-success-check {
        stroke-dasharray: 24;
        animation: success-check 0.6s ease-out forwards;
      }
      .animate-success-text {
        animation: success-text 0.4s ease-out forwards;
      }
    `}</style>
  </div>
  );
}