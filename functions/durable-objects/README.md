# ConversationDO - Durable Object Implementation

**Per-conversation session state management for Cloudflare Workers**

---

## Overview

`ConversationDO` is a Durable Object that manages conversation state for chat sessions. It provides:

- **Message History**: Stores recent messages (last 50)
- **Token Usage Tracking**: Tracks prompt, completion, and total tokens
- **Session Management**: Initialize, reset, and query conversation state
- **Persistent Storage**: State persists across requests using Durable Object storage

---

## Architecture

### Durable Object Class
- **File**: `functions/durable-objects/ConversationDO.ts`
- **Exported from**: `worker.ts` (custom worker entrypoint)
- **Binding**: `env.CONVERSATION_SESSIONS` (configured in `wrangler.toml`)

### Client Helper
- **File**: `lib/conversation-do-client.ts`
- **Class**: `ConversationDOClient`
- Provides easy-to-use methods for interacting with ConversationDO

---

## Usage

### 1. Get ConversationDO Stub

```typescript
import { getConversationDO } from '@/lib/conversation-do-client';

// In a Worker or API route
const stub = getConversationDO(env, threadId);
if (!stub) {
  throw new Error('CONVERSATION_SESSIONS not configured');
}
```

### 2. Use ConversationDOClient

```typescript
import { ConversationDOClient } from '@/lib/conversation-do-client';

const client = new ConversationDOClient(stub);

// Initialize conversation
await client.init(threadId, userId, tenantId);

// Append messages
await client.appendMessage('user', 'Hello!');
await client.appendMessage('assistant', 'Hi there!');

// Get recent messages
const messages = await client.getRecentMessages(20);

// Record token usage
await client.recordUsage(100, 50); // 100 prompt, 50 completion tokens

// Get token usage
const usage = await client.getTokenUsage();
console.log(usage); // { prompt: 100, completion: 50, total: 150 }

// Reset session
await client.resetSession();
```

### 3. Direct HTTP API (Alternative)

You can also call the Durable Object directly via HTTP:

```typescript
const doId = env.CONVERSATION_SESSIONS.idFromName(threadId);
const stub = env.CONVERSATION_SESSIONS.get(doId);

// Initialize
await stub.fetch('https://do/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ threadId, userId, tenantId }),
});

// Get messages
const response = await stub.fetch('https://do/messages?limit=20');
const { messages } = await response.json();
```

---

## API Endpoints

All endpoints use the base URL `https://do` (the actual domain is ignored):

### `POST /init`
Initialize conversation state.

**Request:**
```json
{
  "threadId": "thread_123",
  "userId": "user_456",
  "tenantId": "tenant_789" // optional
}
```

**Response:**
```json
{
  "success": true,
  "state": { ... }
}
```

### `POST /message`
Append a message to the conversation.

**Request:**
```json
{
  "role": "user", // "user" | "assistant" | "system"
  "content": "Hello!"
}
```

### `GET /messages?limit=20`
Get recent messages.

**Response:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!", "timestamp": "2025-01-15T..." },
    { "role": "assistant", "content": "Hi!", "timestamp": "2025-01-15T..." }
  ]
}
```

### `POST /usage`
Record token usage.

**Request:**
```json
{
  "promptTokens": 100,
  "completionTokens": 50
}
```

### `GET /usage`
Get current token usage.

**Response:**
```json
{
  "usage": {
    "prompt": 100,
    "completion": 50,
    "total": 150
  }
}
```

### `GET /state`
Get full conversation state.

**Response:**
```json
{
  "state": {
    "threadId": "thread_123",
    "userId": "user_456",
    "tenantId": "tenant_789",
    "recentMessages": [...],
    "tokensUsed": { "prompt": 100, "completion": 50, "total": 150 },
    "lastActivity": "2025-01-15T...",
    "createdAt": "2025-01-15T..."
  }
}
```

### `POST /reset`
Reset session (clear messages and tokens).

---

## State Structure

```typescript
interface ConversationState {
  threadId: string;
  tenantId?: string;
  userId: string;
  recentMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string; // ISO string
  }>;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  lastActivity: string; // ISO string
  createdAt: string; // ISO string
}
```

---

## Integration with Chat Service

Example integration with `ChatService`:

```typescript
import { getConversationDO } from '@/lib/conversation-do-client';
import { ConversationDOClient } from '@/lib/conversation-do-client';

async function processChatWithDO(
  env: Env,
  threadId: string,
  userId: string,
  message: string
) {
  // Get Durable Object stub
  const stub = getConversationDO(env, threadId);
  if (!stub) {
    // Fallback to database if DO not available
    return processChatWithDB(threadId, userId, message);
  }

  const client = new ConversationDOClient(stub);

  // Initialize if needed
  try {
    await client.getState();
  } catch {
    await client.init(threadId, userId);
  }

  // Get recent messages for context
  const recentMessages = await client.getRecentMessages(20);

  // Process chat (call OpenAI, etc.)
  const response = await chatService.processMessage({
    message,
    threadId,
    userId,
    context: recentMessages,
  });

  // Append messages
  await client.appendMessage('user', message);
  await client.appendMessage('assistant', response.content);

  // Record token usage
  await client.recordUsage(
    response.usage.prompt_tokens,
    response.usage.completion_tokens
  );

  return response;
}
```

---

## Configuration

### wrangler.toml

```toml
[[durable_objects.bindings]]
name = "CONVERSATION_SESSIONS"
class_name = "ConversationDO"

[[migrations]]
tag = "v1"
new_classes = ["ConversationDO"]
```

### Environment Variables

No additional environment variables needed. The Durable Object uses:
- `env.CONVERSATION_SESSIONS` - Durable Object namespace (from binding)
- Durable Object storage (automatic, no config needed)

---

## Limitations & Future Enhancements

### Current Implementation (v1)
- ✅ Basic message storage (last 50 messages)
- ✅ Token usage tracking
- ✅ Session initialization and reset
- ✅ HTTP API for all operations

### Future Enhancements (Phase 3+)
- [ ] Database persistence (sync to Supabase)
- [ ] DDS-specific state management
- [ ] Message search and filtering
- [ ] Automatic cleanup of old sessions
- [ ] Rate limiting per conversation
- [ ] WebSocket support for real-time updates

---

## Testing

### Local Testing

```bash
# Start wrangler dev
npx wrangler dev

# Test ConversationDO
curl -X POST http://localhost:8787/api/test-conversation-do \
  -H "Content-Type: application/json" \
  -d '{"threadId": "test_123", "userId": "user_456"}'
```

### Production Testing

Use the client helper in your API routes or Workers:

```typescript
// In a Worker Function
export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { env } = ctx;
  const stub = getConversationDO(env, 'test_thread');
  const client = new ConversationDOClient(stub);
  await client.init('test_thread', 'test_user');
  // ... test operations
};
```

---

## Troubleshooting

### Error: "CONVERSATION_SESSIONS not configured"
- Check `wrangler.toml` has the binding configured
- Ensure `worker.ts` exports `ConversationDO`
- Verify migration is applied: `npx wrangler migrations apply`

### Error: "Conversation not initialized"
- Call `init()` before other operations
- Check that `threadId` and `userId` are provided

### State not persisting
- Durable Objects persist automatically
- Check Cloudflare dashboard for DO status
- Verify no errors in Worker logs

---

**Last Updated:** 2025-01-15  
**Status:** ✅ Implemented and Ready for Use




