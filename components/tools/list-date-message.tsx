import { Calendar, Clock } from "lucide-react";
import { ToolInvocation } from "ai";
import { useChatContext } from "../chat-context";
import { Button } from "../ui/button";

export default function ListDateMessage({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;

}) {
  const result: Record<string, string[]> =
    toolInvocation.state === "result" ? toolInvocation.result : {};
    console.log("🚀 ~ file: list-date-message.tsx:13 ~ result:", result)
  const { setInput, handleSubmit } = useChatContext();
  const handleDateClick = (date: string, time: string) => {
    setInput(`I want to book an appointment on ${date} at ${time}`);
    handleSubmit();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Available Time Slots
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(result).map(([date, times], index) => (
            <div
              key={index}
              className={`p-4 rounded-lg cursor-pointer transition-all ${"bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"} border`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {date}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {times.map((time, timeIndex) => (
                  <Button
                    key={timeIndex}
                    variant="outline"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300"
                    onClick={() => handleDateClick(date, time)}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{time}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
