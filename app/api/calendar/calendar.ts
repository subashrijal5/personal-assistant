import { google } from "googleapis";
import { addMinutes, setHours, setMinutes, isBefore, isAfter } from "date-fns";

// Define working hours (9 AM to 5 PM JST)
const WORKING_HOURS = {
  start: 11,
  end: 20,
  slotDuration: 30, // minutes
};

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  attendees?: { email: string; name?: string }[];
  location?: string;
  status: string;
}

export interface ListEventsOptions {
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
  orderBy?: 'startTime' | 'updated';
  query?: string; // For text search within events

  singleEvents?: boolean; // Whether to expand recurring events
}

export async function listCalendarEvents(options: ListEventsOptions = {}): Promise<CalendarEvent[]> {
  const { calendar } = await getClient();
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: options.timeMin?.toISOString() || new Date().toISOString(),
      timeMax: options.timeMax?.toISOString(),
      maxResults: options.maxResults || 100,
      orderBy: options.orderBy || 'startTime',
      q: options.query,
      showDeleted: false,
      singleEvents: options.singleEvents ?? true,
    
    });

    return (response.data.items || []).map(event => ({
      id: event.id!,
      title: event.summary!,
      start: event.start?.dateTime || event.start!.date as string,
      end: event.end?.dateTime || event.end!.date as string,
      description: event.description ?? "",
      attendees: event.attendees?.map(attendee => ({
        email: attendee.email!,
        name: attendee.displayName ?? ""
      })),
      location: event.location ?? "",
      status: event.status ?? "Unknown"
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

export async function getAvailableCalendarSlots({
  start,
  end,
}: {
  start: Date;
  end: Date;
}) {
  console.log("Getting available calendar slots between", start, end);
  // Get busy slots from calendar
  const { calendar } = await getClient();
  const busySlots = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: "primary" }],
    },
  });

  const busyTimes = busySlots.data.calendars?.primary.busy || [];

  // Generate all possible slots within working hours
  const availableSlots: Date[] = [];
  let currentSlot = new Date(start);

  while (isBefore(currentSlot, end)) {
    const hour = currentSlot.getHours();
    const isWorkingHour =
      hour >= WORKING_HOURS.start && hour < WORKING_HOURS.end;

    if (isWorkingHour) {
      // Check if slot is busy
      const isBusy = busyTimes.some(
        (busy) =>
          isAfter(currentSlot, new Date(busy.start!)) &&
          isBefore(currentSlot, new Date(busy.end!))
      );

      if (!isBusy) {
        availableSlots.push(new Date(currentSlot));
      }
    }

    // Move to next slot
    currentSlot = addMinutes(currentSlot, WORKING_HOURS.slotDuration);
  }

  return availableSlots;
}

// Function to get next available slots from now
export async function getNextAvailableSlots(numberOfDays: number = 7) {
  const now = new Date();
  const end = addMinutes(now, numberOfDays * 24 * 60); // Convert days to minutes

  // Adjust start time to next working hour if outside working hours
  let start = new Date(now);
  const currentHour = start.getHours();

  if (currentHour < WORKING_HOURS.start) {
    // If before working hours, set to start of working hours
    start = setHours(setMinutes(start, 0), WORKING_HOURS.start);
  } else if (currentHour >= WORKING_HOURS.end) {
    // If after working hours, set to start of next working day
    start = setHours(
      setMinutes(addMinutes(start, 24 * 60), 0),
      WORKING_HOURS.start
    );
  }

  return getAvailableCalendarSlots({ start, end });
}

export async function createCalendarEvent({
  guestName,
  guestEmail,
  startTime,
  guestNotes,
  durationInMinutes,
  eventName,
}: {
  guestName: string;
  guestEmail: string;
  startTime: string;
  guestNotes?: string | null;
  durationInMinutes: number;
  eventName: string;
}) {
  const { calendar } = await getClient();
  try {
    const localestartTime = new Date(startTime);
    const calendarEvent = await calendar.events.insert({
      calendarId: "primary", // or your specific calendar ID
      requestBody: {
        attendees: [
          { email: guestEmail, displayName: guestName },
          { email: "subashrijal@gmail.com", displayName: "Subash Rijal" },
        ],
        description: guestNotes
          ? `Additional Details: ${guestNotes}`
          : undefined,
        start: {
          dateTime: localestartTime.toISOString(),
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: addMinutes(
            localestartTime,
            durationInMinutes
          ).toISOString(),
          timeZone: "Asia/Tokyo",
        },
        summary: `${guestName}: ${eventName}`,
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}-${Math.random()
              .toString(36)
              .substring(2)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });
    console.log("🚀 ~ file: calendar.ts:130 ~ calendarEvent:", calendarEvent);
    return {
      ...calendarEvent.data,
      meetLink: calendarEvent.data.hangoutLink,
    };
  } catch (error) {
    console.log("🚀 ~ file: calendar.ts:99 ~ calendar:", error)
    return { error };
  }
}

async function getClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Set credentials using the refresh token
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  return { calendar, oauth2Client };
}
