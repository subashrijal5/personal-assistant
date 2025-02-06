import { google } from "googleapis";
import { cookies } from "next/headers";
import { validateAndRefreshToken } from "./google-auth";

async function getTasksClient() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token");

  if (!refreshToken?.value) {
    throw new Error("No refresh token found. Please authenticate first.");
  }

  const { valid, client } = await validateAndRefreshToken(refreshToken.value);

  if (!valid || !client) {
    throw new Error("Invalid or expired token. Please authenticate again.");
  }

  return google.tasks({ version: "v1", auth: client });
}

interface TaskParams {
  title: string;
  notes?: string;
  due?: string;
  listId?: string;
}

interface TaskListParams {
  title: string;
}

export async function createTaskList({ title }: TaskListParams) {
  try {
    const tasks = await getTasksClient();
    const response = await tasks.tasklists.insert({
      requestBody: {
        title,
      },
    });

    return {
      success: true,
      taskList: {
        id: response.data.id,
        title: response.data.title,
      },
    };
  } catch (error) {
    console.error("Error creating task list:", error);
    throw error;
  }
}

export async function getTaskLists() {
  try {
    const tasks = await getTasksClient();
    console.log("🚀 ~ file: tasks.ts:58 ~ tasks:", tasks);
    const response = await tasks.tasklists.list();
    console.log("🚀 ~ file: tasks.ts:59 ~ response:", response);

    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching task lists:", error);
    throw error;
  }
}

export async function createTask({
  title,
  notes,
  due,
  listId = "@default",
}: TaskParams) {
  console.log("🚀 ~ file: tasks.ts:71 ~ title:", title, notes, due);
  const date = due ? new Date(due).toISOString() : null;
  try {
    const tasks = await getTasksClient();
    const response = await tasks.tasks.insert({
      tasklist: listId,
      requestBody: {
        title,
        notes: notes ?? "",
        due: date,
        status: "needsAction",
      },
    });

    return {
      success: true,
      task: {
        id: response.data.id,
        title: response.data.title,
        notes: response.data.notes,
        due: response.data.due,
        status: response.data.status,
        completed: response.data.completed,
      },
    };
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    console.error("Error creating task:", error?.response?.data?.error?.errors);
    // throw error;
    return {
      success: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      error: error?.response?.data,
    };
  }
}

export async function listTasks(listId = "@default", showCompleted = false) {
  try {
    const tasks = await getTasksClient();
    const response = await tasks.tasks.list({
      tasklist: listId,
      showCompleted,
      maxResults: 100,
    });

    return response.data.items || [];
  } catch (error) {
    console.error("Error listing tasks:", error);
    throw error;
  }
}

export async function updateTaskStatus(
  taskId: string,
  listId = "@default",
  completed = true
) {
  try {
    const tasks = await getTasksClient();
    const response = await tasks.tasks.patch({
      tasklist: listId,
      task: taskId,
      requestBody: {
        status: completed ? "completed" : "needsAction",
        completed: completed ? new Date().toISOString() : null,
      },
    });

    return {
      success: true,
      task: {
        id: response.data.id,
        title: response.data.title,
        notes: response.data.notes,
        due: response.data.due,
        status: response.data.status,
        completed: response.data.completed,
      },
    };
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}
