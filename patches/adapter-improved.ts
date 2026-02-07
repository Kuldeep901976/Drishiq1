/**
 * IMPROVED ADAPTER: packages/handlers/simple-chat-handler.adapter.ts
 * 
 * This patch improves the adapter to handle all webpack export patterns,
 * including deeply nested default exports.
 * 
 * Changes:
 * - Improved normalizeDefaultExport to handle nested defaults
 * - Better logging for debugging
 * - More candidate function names
 * - Handles edge cases where exports are wrapped multiple times
 */

import * as namedExports from '@/lib/simple-chat-handler';
import defaultExport from '@/lib/simple-chat-handler';

type HandlerShape = {
  getOrCreateSession: (...args: any[]) => Promise<any>;
  getSessionByAssistantThreadId?: (...args: any[]) => Promise<any>;
  ensureSessionAssistantThreadId?: (...args: any[]) => Promise<any>;
  addMessageToSession?: (...args: any[]) => Promise<any>;
  getSessionMessages?: (...args: any[]) => Promise<any>;
  updateSessionMetadata?: (...args: any[]) => Promise<any>;
  getOpenAIConfig?: (...args: any[]) => any;
};

function pickFn(obj: any, names: string[]): ((...args: any[]) => any) | null {
  for (const n of names) {
    if (obj && typeof obj[n] === 'function') {
      return obj[n].bind(obj);
    }
  }
  return null;
}

function normalizeDefaultExport(def: any, depth: number = 0): any {
  // Prevent infinite recursion
  if (depth > 5) {
    console.warn('⚠️ Adapter: Max depth reached in normalizeDefaultExport');
    return {};
  }

  if (!def) return {};

  // Handle nested default.default.default... (webpack sometimes wraps)
  if (typeof def === 'object' && 'default' in def) {
    return normalizeDefaultExport(def.default, depth + 1);
  }

  if (typeof def === 'function') {
    // If default is a factory function: call with no args (safe) if it returns object
    try {
      if (def.length === 0) {
        const maybeInstance = def();
        if (maybeInstance && typeof maybeInstance === 'object') {
          return maybeInstance;
        }
      }
    } catch (e) {
      // ignore call failures
    }

    // If default is class, we can attempt new (safe only if no required ctor args)
    try {
      if (def.length === 0 || def.length === 1) {
        const instance = new (def as any)();
        if (instance && typeof instance === 'object') {
          return instance;
        }
      }
    } catch (e) {
      // ignore constructor failures
    }

    // fallback: return wrapper that exposes the function as method
    return { defaultFunction: def };
  } else if (typeof def === 'object') {
    return def;
  }

  return {};
}

export function resolveSimpleChatHandler(): HandlerShape {
  try {
    // Merge named exports and normalized default export
    const defaultObj = normalizeDefaultExport(defaultExport as any);
    const merged = { ...(namedExports as any), ...(defaultObj || {}) };

    // Log available keys for debugging (only in dev)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Adapter: Available keys:', {
        namedKeys: Object.keys(namedExports || {}),
        defaultKeys: defaultObj ? Object.keys(defaultObj) : [],
        mergedKeys: Object.keys(merged)
      });
    }

    // Candidate names that might represent the expected function
    const candidateNames = [
      'getOrCreateSession',
      'createSession',
      'startSession',
      'getSession',
      'openSession',
      'getOrCreateCurrentSession',
      'defaultFunction'
    ];

    const fn = pickFn(merged, candidateNames);

    if (!fn) {
      const available = [
        ...Object.keys(namedExports || {}),
        ...(defaultExport ? ['default'] : [])
      ];
      
      // Log detailed structure for debugging
      console.error('❌ Adapter: Function not found', {
        available,
        defaultExportType: typeof defaultExport,
        defaultExportKeys: defaultExport && typeof defaultExport === 'object' ? Object.keys(defaultExport) : [],
        mergedKeys: Object.keys(merged)
      });

      const e: any = new Error('resolveSimpleChatHandler function not found in adapter module');
      e.code = 'HANDLER_API_MISMATCH';
      e.availableExports = available;
      e.moduleStructure = {
        hasDefault: !!defaultExport,
        defaultType: typeof defaultExport,
        defaultKeys: defaultExport && typeof defaultExport === 'object' ? Object.keys(defaultExport) : [],
        namedKeys: Object.keys(namedExports || {}),
        mergedKeys: Object.keys(merged)
      };
      throw e;
    }

    // Build complete handler object with all available functions
    const handler: HandlerShape = {
      getOrCreateSession: async (...args: any[]) => {
        return await fn(...args);
      }
    };

    // Try to attach other functions if available
    const otherFunctions = [
      'getSessionByAssistantThreadId',
      'ensureSessionAssistantThreadId',
      'addMessageToSession',
      'getSessionMessages',
      'updateSessionMetadata',
      'getOpenAIConfig'
    ];

    for (const funcName of otherFunctions) {
      const foundFn = pickFn(merged, [funcName]);
      if (foundFn) {
        (handler as any)[funcName] = foundFn;
      }
    }

    return handler;
  } catch (error: any) {
    // Re-throw HandlerAPIMismatchError as-is
    if (error && typeof error === 'object' && 'code' in error && error.code === 'HANDLER_API_MISMATCH') {
      throw error;
    }
    
    // Wrap other errors
    const e: any = new Error(`Adapter resolution failed: ${error?.message || String(error)}`);
    e.code = 'HANDLER_API_MISMATCH';
    e.availableExports = [];
    e.originalError = error;
    throw e;
  }
}

// Default export for webpack compatibility
export default {
  resolveSimpleChatHandler
};


