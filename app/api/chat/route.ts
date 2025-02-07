import { streamText, tool } from "ai";
import { generateModel } from "@/lib/server/ai-model";
import { z } from "zod";
import {
  createCalendarEvent,
  getNextAvailableSlots,
  listCalendarEvents,
  ListEventsOptions,
} from "@/app/api/calendar/calendar";
import { getEmails, sendEmail } from "@/lib/server/email";
import {
  createTask,
  createTaskList,
  listTasks,
  updateTaskStatus,
} from "@/lib/server/tasks";
import {
  createDoc,
  getDocContent,
  listDocs,
  updateDoc,
} from "@/lib/server/docs";
import { PlaceType, searchPlaces } from "@/lib/server/places";
import { getLocation } from "@/lib/server/get-location";
import { searchWeb } from "@/lib/server/search";
import {
  createContact,
  updateContact,
  searchContacts,
} from "@/lib/server/contacts";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemMessage = {
    role: "system",
    content: `You are a highly capable personal assistant, designed to help manage various aspects of daily life and work. Your capabilities include:

    When user ask for daily overview, you should provide a concise summary of upcoming events,  tasks,  emails, etc with good message in users lamguage, Like have a good day etc. 
    Always use proper iosString whenever you need to use date in the tool and message, never use terms like today, tomorrow, next week, etc.
    Always response in the user's language, for example, if user is using Japanese, always respond in Japanese but if user ask to translate, translate it in targeted language.
    Use multiple steps and tools to accomplish the task whenever necessary.
1. Email Management:
   - Reading and summarizing emails
   - Drafting and sending emails
   - Organizing and prioritizing messages

2. Calendar Management:
   - Scheduling meetings and appointments
   - Checking availability
   - Setting up reminders for important events

3. Note Taking:
   - Creating and organizing notes
   - Searching through existing notes
   - Summarizing important information

4. Daily Overview:
   - Providing summaries of upcoming events
   - Highlighting important tasks and deadlines
   - Offering weather updates and relevant information

When interacting:
1. Be concise and professional in your responses
2. Always explain and return small message along with a tool call to execute the action
3. When analyzing documents:
   - First use getDocContent to fetch the document
   - Then analyze the content and provide a concise summary
   - Focus on key points, main ideas, and important details
   - Format the response in a clear, structured way
   - Use multiple steps to complete the action
4. Always confirm important actions before executing them
5. Maintain user privacy and security
6. Ask for clarification when needed
7. Provide helpful suggestions and reminders
8. Use natural, conversational language
9. Don't ask too many questions, for example, when user ask to find restaurant in tokyo, just find it.
10. When User ask to find something near me, first check the location and then find the place.

Your goal is to make the user's life easier by managing their tasks, communications, and information effectively while maintaining a professional and helpful demeanor.`,
  };
  const response = streamText({
    model: generateModel,
    tools: {
      searchWeb: tool({
        description: "Search web content using google custom search",
        parameters: z.object({
          query: z
            .string()
            .min(3)
            .max(100)
            .describe(
              "The search query minimum length is 3 and maximum length is 100"
            ),
          timeout: z.number().min(1000).max(30000).optional(),
        }),
        execute: async function ({ query, timeout }) {
          return await searchWeb({
            query,
            num: 10,
            timeout,
          });
        },
      }),
      searchPlaces: tool({
        description:
          "Search for places using Google Places API with various filters",
        parameters: z.object({
          query: z.string(),
          type: z.nativeEnum(PlaceType).optional(),
          radius: z.number().min(100).max(50000).optional(), // radius in meters
          location: z
            .object({
              lat: z.number(),
              lng: z.number(),
            })
            .optional(),
          language: z.string().optional(),
          openNow: z.boolean().optional(),
        }),
        execute: async function (params) {
          return await searchPlaces(params);
        },
      }),
      getAvailability: tool({
        description: "Get available time slots for a given number of days",
        parameters: z.object({ numberOfDays: z.number().min(1).max(30) }),
        execute: async function ({ numberOfDays }) {
          const dates = await getNextAvailableSlots(numberOfDays);

          // Group slots by date
          const groupedSlots = dates.reduce((acc, date) => {
            const dateKey = date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Tokyo",
            });

            const timeStr = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Tokyo",
              hour12: true,
            });

            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }
            acc[dateKey].push(timeStr);
            return acc;
          }, {} as Record<string, string[]>);

          return groupedSlots;
        },
      }),
      getLocation: tool({
        description: "Get location information of the user ",
        execute: async function () {
          return await getLocation();
        },
        parameters: z.object({}),
      }),
      listEvents: tool({
        description: "List calendar events with advanced filtering options",
        parameters: z.object({
          timeMin: z
            .string()
            .optional()
            .describe("Should be future date in ISOstring format"), // ISO string
          timeMax: z
            .string()
            .optional()
            .describe("Should be future date in ISOstring format"), // ISO string
          maxResults: z.number().min(1).max(100).optional(),
          orderBy: z.enum(["startTime", "updated"]).optional(),
          query: z.string().optional(),
          status: z.enum(["confirmed", "tentative", "cancelled"]).optional(),
          singleEvents: z.boolean().optional(),
        }),
        execute: async function (params) {
          const options: ListEventsOptions = {
            ...params,
            timeMin: params.timeMin ? new Date(params.timeMin) : undefined,
            timeMax: params.timeMax ? new Date(params.timeMax) : undefined,
          };
          const events = await listCalendarEvents(options);

          // Group events by date
          const groupedEvents = events.reduce((acc, event) => {
            const date = new Date(event.start);
            const dateKey = date.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Tokyo",
            });

            if (!acc[dateKey]) {
              acc[dateKey] = [];
            }

            acc[dateKey].push({
              id: event.id,
              title: event.title,
              time: date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Tokyo",
                hour12: true,
              }),
              description: event.description,
              attendees: event.attendees,
              location: event.location,
              status: event.status,
            });

            return acc;
          }, {} as Record<string, unknown[]>);

          return groupedEvents;
        },
      }),

      createCalendarEvent: tool({
        description: "Schedule a calendar event and return event details",
        parameters: z.object({
          startTime: z.string(),
          guestName: z.string(),
          guestEmail: z.string(),
          guestNotes: z.string().optional(),
          eventName: z.string(),
        }),
        execute: async function (params) {
          return await createCalendarEvent({
            ...params,
            durationInMinutes: 30,
          });
        },
      }),
      readEmails: tool({
        description: "Fetch and summarize recent emails with optional filters",
        parameters: z.object({
          count: z.number().min(1).max(50),
          folder: z.string().optional(),
          filters: z
            .object({
              fromDate: z
                .string()
                .optional()
                .describe("From date (YYYY-MM-DD)"),
              toDate: z.string().optional().describe("To date (YYYY-MM-DD)"),
              query: z.string().optional().describe("Search query"),
            })
            .optional(),
        }),
        execute: async function ({ count, folder, filters }) {
          return await getEmails(count, folder, filters);
        },
      }),
      sendEmail: tool({
        description: "Send an email",
        parameters: z.object({
          to: z.string(),
          subject: z.string(),
          body: z.string(),
          cc: z.string().optional(),
          bcc: z.string().optional(),
        }),
        execute: async function (params) {
          return await sendEmail(params);
        },
      }),
      createTaskList: tool({
        description: "Create a new task list in Google Tasks",
        parameters: z.object({
          title: z.string(),
        }),
        execute: async function (params) {
          return await createTaskList(params);
        },
      }),
      createTask: tool({
        description: "Create a new task in Google Tasks",
        parameters: z.object({
          title: z.string(),
          notes: z.string().optional(),
          due: z.string().optional().describe("Due date in ISOstring format"),
          listId: z.string().optional(),
        }),
        execute: async function (params) {
          return await createTask(params);
        },
      }),
      listTasks: tool({
        description: "List tasks from a specific task list",
        parameters: z.object({
          listId: z
            .string()
            .optional()
            .describe(
              "The ID of the task list, or empty to list tasks for the default task list"
            ),
          showCompleted: z
            .boolean()
            .optional()
            .describe("Whether to include completed tasks"),
        }),
        execute: async function (params) {
          return await listTasks(params.listId, params.showCompleted);
        },
      }),
      updateTaskStatus: tool({
        description: "Update a task's completion status",
        parameters: z.object({
          taskId: z.string(),
          listId: z.string().optional(),
          completed: z.boolean().optional(),
        }),
        execute: async function (params) {
          return await updateTaskStatus(
            params.taskId,
            params.listId,
            params.completed
          );
        },
      }),
      createDoc: tool({
        description:
          "Create a new Google Doc. I'll help format the content professionally using Google Docs styles. Just provide the content in plain text, and I'll structure it with appropriate headings, paragraphs, and formatting.",
        parameters: z.object({
          title: z.string().describe("The title of the document"),
          content: z
            .string()
            .describe(
              "The content of the document in plain text. I'll help format it professionally."
            ),
          folderId: z
            .string()
            .optional()
            .describe(
              "Optional Google Drive folder ID to save the document in"
            ),
        }),
        execute: async function (params) {
          // First create the document
          const doc = await createDoc({
            title: params.title,
            content: params.content,
            folderId: params.folderId,
          });

          return {
            ...doc,
            message:
              "I've created your document and formatted it professionally. You can now open it to view and edit.",
          };
        },
      }),
      updateDoc: tool({
        description: "Update the content of an existing Google Doc",
        parameters: z.object({
          documentId: z.string(),
          content: z.string(),
        }),
        execute: async function (params) {
          return await updateDoc(params.documentId, params.content);
        },
      }),
      listDocs: tool({
        description:
          "Search and list Google Docs. If no query is provided, lists recent docs.",
        parameters: z.object({
          query: z
            .string()
            .optional()
            .describe("Search query to find specific documents"),
        }),
        execute: async function ({ query }) {
          return await listDocs(query);
        },
      }),
      getDocContent: tool({
        description: "Get the content of a Google Doc by its ID",
        parameters: z.object({
          documentId: z.string().describe("The ID of the document to retrieve"),
        }),
        execute: async function ({ documentId }) {
          const result = await getDocContent(documentId);
          if (!result.success) {
            throw new Error(result.error);
          }
          return result;
        },
      }),
      createContact: tool({
        description: "Create a new contact in Google Contacts",
        parameters: z.object({
          lastName: z.string().optional(),
          firstName: z.string().optional(),
          phones: z
            .array(
              z.object({
                value: z.string(),
                type: z.enum(["mobile", "home", "work", "other"]),
              })
            )
            .optional(),
          emails: z
            .array(
              z.object({
                value: z.string(),
                type: z.enum(["home", "work", "other"]),
              })
            )
            .optional(),
          addresses: z.array(
            z.object({
              streetAddress: z.string().optional(),
              city: z.string().optional(),
              region: z.string().optional(),
              postalCode: z.string().optional(),
              country: z.string().optional(),
              type: z.enum(["home", "work", "other"]),
            })
          ),
          birthday: z
            .object({
              month: z.number().min(1).max(12),
              day: z.number().min(1).max(31),
            })
            .optional(),
          notes: z.string().optional(),
        }),
        execute: async function ({ ...params }) {
          return await createContact({
            lastName: params.lastName,
            firstName: params.firstName,
            phoneNumbers: params.phones,
            emailAddresses: params.emails,
            addresses: params.addresses,
            birthdays: [
              {
                date: {
                  month: params.birthday?.month,
                  day: params.birthday?.day,
                },
              },
            ],
          });
        },
      }),
      updateContact: tool({
        description: "Update an existing contact in Google Contacts",
        parameters: z.object({
          contactId: z.string(),
          lastName: z.string().optional(),
          firstName: z.string().optional(),
          phones: z
            .array(
              z.object({
                value: z.string(),
                type: z.enum(["mobile", "home", "work", "other"]),
              })
            )
            .optional(),
          emails: z
            .array(
              z.object({
                value: z.string(),
                type: z.enum(["home", "work", "other"]),
              })
            )
            .optional(),
          addresses: z.array(
            z.object({
              streetAddress: z.string().optional(),
              city: z.string().optional(),
              region: z.string().optional(),
              postalCode: z.string().optional(),
              country: z.string().optional(),
              type: z.enum(["home", "work", "other"]),
            })
          ),
          birthday: z
            .object({
              month: z.number().min(1).max(12),
              day: z.number().min(1).max(31),
            })
            .optional(),
          notes: z.string().optional(),
        }),
        execute: async function ({ ...params }) {
          return await updateContact(params.contactId, {
            lastName: params.lastName,
            firstName: params.firstName,
            phoneNumbers: params.phones,
            emailAddresses: params.emails,
            addresses: params.addresses,
            birthdays: [
              {
                date: {
                  month: params.birthday?.month,
                  day: params.birthday?.day,
                },
              },
            ],
          });
        },
      }),
      searchContacts: tool({
        description: "Search for contacts in Google Contacts",
        parameters: z.object({
          query: z.string().describe("Search query"),
        }),
        execute: async function ({ query }) {
          return await searchContacts(query);
        },
      }),
      crawlUrl: tool({
        description: "Test tool",
        parameters: z.object({
          url: z.string().describe("The URL to crawl. It should be https url. For example, For example, https://example.com"),
        }),
        execute: async function ({ url }) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; PersonalAssistant/1.0)",
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return { success: true, content: text };
          } catch (error) {
            console.error("Error fetching web content:", error);
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to fetch web content",
            };
          }
        },
      }),
    },
    maxSteps: 5,
    messages: messages,
    system: systemMessage.content,
    experimental_continueSteps: true,
  });
  return response.toDataStreamResponse();
}
