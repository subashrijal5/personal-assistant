import { NextResponse } from "next/server";
import { updateTaskStatus } from "@/lib/server/tasks";

export async function POST(request: Request) {
  try {
    const { taskId, listId, completed } = await request.json();
    const result = await updateTaskStatus(taskId, listId, completed);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}
