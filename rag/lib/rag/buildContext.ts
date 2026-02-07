/**
 * Context Builder
 * 
 * Builds context from retrieved memories for OpenAI Assistant API.
 * 
 * Usage:
 *   const context = buildContext(memories);
 *   // Use context in Assistant API call
 */

import { RetrievedMemory } from './retriever';

export interface RAGContext {
  formatted: string; // Formatted text for OpenAI
  memories: RetrievedMemory[];
  summary?: string; // Optional AI-generated summary
}

/**
 * Build context from retrieved memories
 */
export function buildContext(memories: RetrievedMemory[]): RAGContext {
  if (memories.length === 0) {
    return {
      formatted: '',
      memories: []
    };
  }

  // Group by content type
  const byType = memories.reduce((acc, m) => {
    if (!acc[m.contentType]) {
      acc[m.contentType] = [];
    }
    acc[m.contentType].push(m);
    return acc;
  }, {} as Record<string, RetrievedMemory[]>);

  // Format for OpenAI
  const sections: string[] = [];

  // Preferences section
  if (byType['preference']) {
    sections.push('## User Preferences');
    byType['preference'].forEach((m, i) => {
      sections.push(`${i + 1}. ${m.content} (Relevance: ${m.relevanceScore.toFixed(2)})`);
    });
  }

  // Facts section
  if (byType['fact']) {
    sections.push('## Key Facts About User');
    byType['fact'].forEach((m, i) => {
      sections.push(`${i + 1}. ${m.content} (Relevance: ${m.relevanceScore.toFixed(2)})`);
    });
  }

  // Goals section
  if (byType['goal']) {
    sections.push('## User Goals');
    byType['goal'].forEach((m, i) => {
      sections.push(`${i + 1}. ${m.content} (Relevance: ${m.relevanceScore.toFixed(2)})`);
    });
  }

  // Challenges section
  if (byType['challenge']) {
    sections.push('## User Challenges');
    byType['challenge'].forEach((m, i) => {
      sections.push(`${i + 1}. ${m.content} (Relevance: ${m.relevanceScore.toFixed(2)})`);
    });
  }

  // Insights section
  if (byType['insight']) {
    sections.push('## Insights');
    byType['insight'].forEach((m, i) => {
      sections.push(`${i + 1}. ${m.content} (Relevance: ${m.relevanceScore.toFixed(2)})`);
    });
  }

  // General conversation memories
  if (byType['conversation']) {
    sections.push('## Recent Conversation Context');
    byType['conversation'].slice(0, 5).forEach((m, i) => {
      sections.push(`${i + 1}. ${m.content} (Date: ${m.createdAt.toISOString().split('T')[0]})`);
    });
  }

  const formatted = sections.join('\n\n');

  return {
    formatted,
    memories
  };
}

/**
 * Build context with AI-generated summary (optional, for future enhancement)
 */
export async function buildContextWithSummary(
  memories: RetrievedMemory[]
): Promise<RAGContext> {
  const baseContext = buildContext(memories);

  // TODO: Use AI to generate a concise summary of memories
  // For now, return base context
  return baseContext;
}


