import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { v4 as uuidv4 } from 'uuid';

// Lazy initialization - only create client when route handler is called
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId = "anon" } = body as { userId?: string };

    // Migration: avoid using provider-managed threads (beta.threads).
    // Use an app-managed thread id (UUID) and persist into chat_threads as needed.
    // Generate a UUID for the new thread.
    const threadId = uuidv4();
    // TODO: Persist threadId into chat_threads table (e.g., INSERT INTO chat_threads ...)
    // Note: callers previously expected 'thread.id' — we return an object with id property for compatibility.
    const thread = { id: threadId };
    
    console.log(`🆕 Generated new threadId for reset: ${threadId}`);

    return NextResponse.json({
      threadId: thread.id,
      message: "Thread reset successfully"
    });
  } catch (err: any) {
    console.error("Reset thread error:", err);
    return NextResponse.json(
      { error: "Failed to reset thread", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

