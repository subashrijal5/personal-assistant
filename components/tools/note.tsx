import { ToolInvocation } from "ai";
import { format } from "date-fns";
import { StickyNote, Tag, Calendar, AlertCircle } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
}

export default function Note({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const isSearch = toolInvocation.toolName === "searchNotes";
  console.log("🚀 ~ file: note.tsx:19 ~ isSearch:", toolInvocation)
  const notes = isSearch && toolInvocation.state === "result"
    ? (toolInvocation.result as Note[])
    : [];

  if (!notes || notes.length === 0) {
    return (
      <div className="flex items-center justify-center p-6 text-gray-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        No notes found
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2 text-primary mb-4">
        <StickyNote className="w-5 h-5" />
        <h2 className="text-lg font-semibold">
          {isSearch ? "Found Notes" : "Created Note"}
        </h2>
      </div>
      <div className="space-y-4">
        {notes.map((note) => {
          const date = new Date(note.createdAt);
          const formattedDate = format(date, "MMM d, h:mm a");

          return (
            <div
              key={note.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{note.title}</h3>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
                {note.content}
              </p>
              {note.tags && note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
