import { ToolInvocation } from "ai";
import { format } from "date-fns";
import { Mail, Calendar, ChevronRight, AlertCircle } from "lucide-react";

interface Email {
  id: string;
  subject?: string;
  from?: string;
  date: string;
  snippet: string;
}

export default function ReadEmail({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const emails =
    toolInvocation.state === "result" ? (toolInvocation.result as Email[]) : [];

  if (!emails || emails.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        No emails found
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Mail className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Recent Emails</h2>
      </div>
      <div className="space-y-3">
        {emails.map((email) => {
          const date = new Date(email.date);
          const formattedDate = format(date, "MMM d, h:mm a");

          return (
            <div
              key={email.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {email.subject || "No Subject"}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span className="truncate">
                      {email.from || "Unknown Sender"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formattedDate}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {email.snippet}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
