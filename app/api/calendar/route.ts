import { createCalendarEvent } from "./calendar";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const event = await createCalendarEvent(body);
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error in calendar API:", error);
    return NextResponse.json(
      { error: "Failed to create calendar event" },
      { status: 500 }
    );
  }
}
