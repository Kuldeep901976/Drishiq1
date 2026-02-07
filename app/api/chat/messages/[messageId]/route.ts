// API endpoint for deleting chat messages
// Only allows deletion of recent messages (within last 1 minute)
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Configuration: Only allow deletion of messages from the last 1 minute
const RECENT_MESSAGE_WINDOW_MINUTES = 1;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const messageId = params.messageId;
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    // Get the message first to verify it exists, check if it's recent, and get thread_id for authorization
    const { data: message, error: fetchError } = await supabase
      .from('chat_messages')
      .select('id, thread_id, role, created_at')
      .eq('id', messageId)
      .single();

    if (fetchError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Check if message is recent (within the last 5 minutes)
    const messageTime = new Date(message.created_at);
    const now = new Date();
    const minutesAgo = (now.getTime() - messageTime.getTime()) / (1000 * 60);
    
    if (minutesAgo > RECENT_MESSAGE_WINDOW_MINUTES) {
      return NextResponse.json(
        { 
          error: "Can only delete recent messages", 
          details: `Messages older than ${RECENT_MESSAGE_WINDOW_MINUTES} minutes cannot be deleted` 
        },
        { status: 403 }
      );
    }

    // Get user ID from headers or session
    const userId = request.headers.get('x-user-id') || 
                   request.headers.get('user-id') ||
                   null;

    // Verify the user owns the thread (optional security check)
    if (userId) {
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .select('user_id')
        .eq('id', message.thread_id)
        .single();

      if (!threadError && thread && thread.user_id !== userId) {
        return NextResponse.json(
          { error: "Unauthorized: You can only delete your own messages" },
          { status: 403 }
        );
      }
    }

    // Only allow deletion of user messages (not assistant messages)
    if (message.role !== 'user') {
      return NextResponse.json(
        { error: "Can only delete your own messages" },
        { status: 403 }
      );
    }

    // Delete the message
    const { error: deleteError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (deleteError) {
      console.error('Error deleting message:', deleteError);
      return NextResponse.json(
        { error: "Failed to delete message", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
      messageId: messageId
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/chat/messages/[messageId]:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

