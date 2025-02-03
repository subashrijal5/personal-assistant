import { ToolInvocation } from "ai";

interface EventItem {
  id: string;
  title: string;
  time: string;
  description?: string;
  location?: string;
  status: string;
  attendees?: { email: string; name?: string }[];
}

export default function ListEvents({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {

  const events: Record<string, EventItem[]> =
    toolInvocation.state === "result" ? toolInvocation.result : {};

  if (!toolInvocation.state || toolInvocation.state !== "result") {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600">Fetching calendar events...</p>
      </div>
    );
  }

  if (!events || Object.keys(events).length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600">No events found for the given criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-wrap gap-2">
      {Object.entries(events).map(([date, dayEvents]) => (
        <div
          key={date}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
        >
          <h3 className="font-medium text-gray-900 mb-2">{date}</h3>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.time}</p>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="text-sm text-gray-600 mt-1">
                        📍 {event.location}
                      </p>
                    )}
                    {event.attendees && event.attendees.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        👥 {event.attendees.length} attendee
                        {event.attendees.length !== 1 && "s"}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      event.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : event.status === "tentative"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
