/**
 * PATCH: app/api/chat/route.ts - Add Route Guards
 * 
 * This patch adds critical guards to ensure assistantThreadId is always
 * validated before use in OpenAI API calls.
 * 
 * Changes:
 * - Add guard after ensureAssistantThreadId
 * - Add guards before all client.beta.threads.runs.retrieve calls
 * - Ensure assistantThreadId is never undefined in API paths
 */

// =====================================================
// PATCH LOCATION 1: After ensureAssistantThreadId (around line 1356)
// =====================================================

// REPLACE THIS:
// assistantThreadId = await ensureAssistantThreadId(userId, clientThreadId, simpleChatHandler, requestId);
// 
// WITH THIS:
assistantThreadId = await ensureAssistantThreadId(userId, clientThreadId, simpleChatHandler, requestId);

// CRITICAL GUARD: Validate assistantThreadId before proceeding
if (!assistantThreadId || typeof assistantThreadId !== 'string' || !assistantThreadId.startsWith('thread_')) {
  console.error('❌ Invalid assistant thread ID:', {
    assistantThreadId,
    type: typeof assistantThreadId,
    userId,
    requestId
  });
  
  return createErrorResponse({
    code: 'INVALID_ASSISTANT_THREAD_ID',
    message: `Invalid assistant thread ID format: expected "thread_xxx", got ${assistantThreadId?.substring(0, 20) || 'undefined'}...`,
    requestId,
    details: {
      received: assistantThreadId,
      expectedFormat: 'thread_xxx'
    }
  }, 400);
}

// =====================================================
// PATCH LOCATION 2: Before greeting run polling (around line 1500-1600)
// =====================================================

// FIND THIS:
// const greetingRun = await client.beta.threads.runs.create(assistantThreadId, { ... });
// const finalRun = await client.beta.threads.runs.retrieve(assistantThreadId, greetingRun.id);

// REPLACE WITH:
const greetingRun = await client.beta.threads.runs.create(assistantThreadId, { ... });

// GUARD: Ensure assistantThreadId is valid before polling
if (!assistantThreadId || !assistantThreadId.startsWith('thread_')) {
  throw new Error(`Cannot poll greeting run: invalid assistantThreadId: ${assistantThreadId}`);
}

const finalRun = await client.beta.threads.runs.retrieve(assistantThreadId, greetingRun.id);

// =====================================================
// PATCH LOCATION 3: Before main conversation run polling (around line 2800-2900)
// =====================================================

// FIND THIS:
// const run = await client.beta.threads.runs.create(assistantThreadId, { ... });
// const finalRun = await client.beta.threads.runs.retrieve(assistantThreadId, run.id);

// REPLACE WITH:
const run = await client.beta.threads.runs.create(assistantThreadId, { ... });

// GUARD: Ensure assistantThreadId is valid before polling
if (!assistantThreadId || !assistantThreadId.startsWith('thread_')) {
  throw new Error(`Cannot poll run: invalid assistantThreadId: ${assistantThreadId}`);
}

const finalRun = await client.beta.threads.runs.retrieve(assistantThreadId, run.id);

// =====================================================
// PATCH LOCATION 4: In ensureAssistantThreadId function (around line 433)
// =====================================================

// ADD AT THE END OF ensureAssistantThreadId, BEFORE RETURN:
const assistantThreadId = await ensureFn(session, incoming);

// VALIDATE BEFORE RETURNING
if (!assistantThreadId || typeof assistantThreadId !== 'string' || !assistantThreadId.startsWith('thread_')) {
  throw new ThreadPersistenceError(
    `Invalid assistant thread ID returned: ${assistantThreadId?.substring(0, 20) || 'undefined'}`,
    'INVALID_ASSISTANT_THREAD_ID',
    500
  );
}

console.log(`✅ Ensured assistant thread ID: ${assistantThreadId} for session ${session.id}`);
return assistantThreadId;


