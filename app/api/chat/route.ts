import { streamText, tool } from "ai";
import { generateModel } from "@/lib/server/ai-model";
import { z } from "zod";
import {
  createCalendarEvent,
  getNextAvailableSlots,
} from "@/app/api/calendar/calendar";
import { getEmails, sendEmail } from "@/lib/email";
import {
  createTask,
  createTaskList,
  listTasks,
  updateTaskStatus,
} from "@/lib/tasks";
import { createDoc, listDocs, updateDoc } from "@/lib/docs";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const systemMessage = {
    role: "system",
    content: `You are a highly capable personal assistant, designed to help manage various aspects of daily life and work. Your capabilities include:

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
2. Always confirm important actions before executing them
3. Maintain user privacy and security
4. Ask for clarification when needed
5. Provide helpful suggestions and reminders
6. Use natural, conversational language

Your goal is to make the user's life easier by managing their tasks, communications, and information effectively while maintaining a professional and helpful demeanor.`,
  };

  const response = streamText({
    model: generateModel,
    tools: {
      getAvailability: tool({
        description: "Get available time slots for a given number of days",
        parameters: z.object({ numberOfDays: z.number().min(1).max(30) }),
        execute: async function ({ numberOfDays }) {
          return await getNextAvailableSlots(numberOfDays);
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
        description: "Fetch and summarize recent emails",
        parameters: z.object({
          count: z.number().min(1).max(50),
          folder: z.string().optional(),
        }),
        execute: async function ({ count, folder }) {
          return await getEmails(count, folder);
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
          due: z.string().optional(),
          listId: z.string().optional(),
        }),
        execute: async function (params) {
          return await createTask(params);
        },
      }),
      listTasks: tool({
        description: "List tasks from a specific task list",
        parameters: z.object({
          listId: z.string().optional(),
          showCompleted: z.boolean().optional(),
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
          content: z.string().describe("The content of the document in plain text. I'll help format it professionally."),
          folderId: z.string().optional().describe("Optional Google Drive folder ID to save the document in"),
        }),
        execute: async function (params) {
          // First create the document
          const doc = await createDoc({
            title: params.title,
            content: params.content,
            folderId: params.folderId
          });

          return {
            ...doc,
            message: "I've created your document and formatted it professionally. You can now open it to view and edit."
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
        description: "Search and list Google Docs. If no query is provided, lists recent docs.",
        parameters: z.object({
          query: z.string().optional().describe('Search query to find specific documents')
        }),
        execute: async function ({ query }) {
          return await listDocs(query);
        },
      }),
    },
    messages: [systemMessage, ...messages],
  });

  return response.toDataStreamResponse();
}
