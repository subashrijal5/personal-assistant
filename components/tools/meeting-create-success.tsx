import { ToolInvocation } from "ai";
import { Calendar, Link, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";

export default function MeetingCreateSuccess({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const result = toolInvocation.state === "result" ? toolInvocation.result : null;
  const meetingLink = result?.hangoutLink || "";
  const eventName = result?.summary || "Meeting";
  const startTime = result?.start?.dateTime ? new Date(result.start.dateTime).toLocaleString() : "";

  if(toolInvocation.state !== "result") {
    return <div>Loading...</div>
  }
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
        <CheckCircle className="w-6 h-6" />
        <h3 className="text-lg font-semibold">Meeting Created Successfully</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Calendar className="w-5 h-5" />
          <span>{eventName} - {startTime}</span>
        </div>
        
        {meetingLink && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Link className="w-5 h-5" />
            <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="underline">
              Join Meeting
            </a>
          </div>
        )}
      </div>
      
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() => window.open(meetingLink, '_blank')}
      >
        Join Meeting
      </Button>
    </div>
  );
}