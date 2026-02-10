/**
 * UPIM intent classifier. Stub; implement with real model when ready.
 */

export interface ClassifyIntentInput {
  tenantId?: string | null;
  text: string;
  useLLMFallback?: boolean;
}

export interface ClassifyIntentResult {
  category?: string;
  tags?: string[];
  confidence?: number;
  [key: string]: unknown;
}

export async function classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentResult> {
  return {
    category: 'general',
    tags: [],
    confidence: 0,
    ...input,
  };
}
