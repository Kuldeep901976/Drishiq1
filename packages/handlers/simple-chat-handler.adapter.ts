/**
 * Robust adapter for simple-chat-handler.
 * Uses dynamic import to avoid webpack bundling issues.
 */

type HandlerShape = {
  getOrCreateSession: (...args: any[]) => Promise<any>;
  getSessionByAssistantThreadId?: (...args: any[]) => Promise<any>;
  ensureSessionAssistantThreadId?: (...args: any[]) => Promise<any>;
  addMessageToSession?: (...args: any[]) => Promise<any>;
  getSessionMessages?: (...args: any[]) => Promise<any>;
  updateSessionMetadata?: (...args: any[]) => Promise<any>;
  getOpenAIConfig?: (...args: any[]) => any;
};

// Cache for the handler module
let cachedHandlerModule: any = null;

/**
 * Resolve simple-chat-handler using dynamic import
 * This avoids webpack bundling issues
 */
export function resolveSimpleChatHandler(): HandlerShape {
  // If cached, use it
  if (cachedHandlerModule) {
    return buildHandlerFromModule(cachedHandlerModule);
  }

  // Try static import first
  try {
    const staticModule = require('@/lib/simple-chat-handler');
    if (staticModule && (staticModule.getOrCreateSession || staticModule.default?.getOrCreateSession)) {
      cachedHandlerModule = staticModule;
      return buildHandlerFromModule(staticModule);
    }
  } catch (e) {
    // Static import failed, will use dynamic
  }

  // If static import didn't work, throw error with instructions for dynamic import
  const e: any = new Error('simple-chat-handler module must be loaded dynamically. Use resolveSimpleChatHandlerAsync() instead.');
  e.code = 'HANDLER_API_MISMATCH';
  e.availableExports = [];
  e.requiresAsync = true;
  throw e;
}

/**
 * Async version that uses dynamic import
 */
export async function resolveSimpleChatHandlerAsync(): Promise<HandlerShape> {
  // If cached, use it
  if (cachedHandlerModule) {
    return buildHandlerFromModule(cachedHandlerModule);
  }

  try {
    // Dynamic import
    const module = await import('@/lib/simple-chat-handler');
    
    if (!module) {
      throw new Error('Module import returned null/undefined');
    }

    cachedHandlerModule = module;
    return buildHandlerFromModule(module);
  } catch (error: any) {
    console.error('❌ Failed to dynamically import simple-chat-handler:', {
      error: error?.message || String(error),
      stack: error?.stack
    });

    const e: any = new Error(`Failed to import simple-chat-handler: ${error?.message || String(error)}`);
    e.code = 'HANDLER_API_MISMATCH';
    e.availableExports = Object.keys(error?.module || {});
    e.originalError = error;
    throw e;
  }
}

/**
 * Build handler object from module
 */
function buildHandlerFromModule(module: any): HandlerShape {
  // Try named exports first
  let getOrCreateSession = module.getOrCreateSession;
  let getSessionByAssistantThreadId = module.getSessionByAssistantThreadId;
  let ensureSessionAssistantThreadId = module.ensureSessionAssistantThreadId;
  let addMessageToSession = module.addMessageToSession;
  let getSessionMessages = module.getSessionMessages;
  let updateSessionMetadata = module.updateSessionMetadata;
  let getOpenAIConfig = module.getOpenAIConfig;

  // If not found, try default export
  if (!getOrCreateSession && module.default) {
    const def = module.default;
    if (typeof def === 'object' && def !== null) {
      getOrCreateSession = getOrCreateSession || def.getOrCreateSession;
      getSessionByAssistantThreadId = getSessionByAssistantThreadId || def.getSessionByAssistantThreadId;
      ensureSessionAssistantThreadId = ensureSessionAssistantThreadId || def.ensureSessionAssistantThreadId;
      addMessageToSession = addMessageToSession || def.addMessageToSession;
      getSessionMessages = getSessionMessages || def.getSessionMessages;
      updateSessionMetadata = updateSessionMetadata || def.updateSessionMetadata;
      getOpenAIConfig = getOpenAIConfig || def.getOpenAIConfig;
    }
  }

  // Validate required function
  if (!getOrCreateSession || typeof getOrCreateSession !== 'function') {
    const available = [
      ...Object.keys(module || {}),
      ...(module.default ? Object.keys(module.default || {}) : [])
    ];
    
    const e: any = new Error('getOrCreateSession function not found in simple-chat-handler module');
    e.code = 'HANDLER_API_MISMATCH';
    e.availableExports = available;
    e.moduleStructure = {
      hasDefault: !!module.default,
      defaultType: typeof module.default,
      defaultKeys: module.default && typeof module.default === 'object' ? Object.keys(module.default) : [],
      namedKeys: Object.keys(module || {}).filter(k => k !== 'default')
    };
    throw e;
  }

  // Build and return handler
  return {
    getOrCreateSession,
    getSessionByAssistantThreadId,
    ensureSessionAssistantThreadId,
    addMessageToSession,
    getSessionMessages,
    updateSessionMetadata,
    getOpenAIConfig
  };
}

// Default export for webpack compatibility
export default {
  resolveSimpleChatHandler,
  resolveSimpleChatHandlerAsync
};
