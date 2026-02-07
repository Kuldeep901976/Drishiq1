/**
 * Agent Tools
 * Utility functions for agent operations
 */

import { discoverStakeholders as sdepDiscoverStakeholders } from '@/lib/ddsa/engines/sdep';

export interface Stakeholder {
  name: string;
  role: string;
  influence: number;
  interest: number;
  type: 'primary' | 'secondary';
}

export interface SDEPContext {
  messages?: Array<{ content?: string; text?: string }>;
  bundled_intake?: {
    who?: string[];
  };
}

/**
 * Discover stakeholders from issue summary and context
 */
export async function discoverStakeholders(
  issueSummary: string,
  threadId: string,
  context?: SDEPContext
): Promise<Stakeholder[]> {
  // Use SDEP engine to discover stakeholders
  const sdepContext: SDEPContext = context || {
    messages: [
      { content: issueSummary }
    ],
    bundled_intake: {}
  };

  const stakeholders = sdepDiscoverStakeholders(sdepContext);
  
  return stakeholders;
}




