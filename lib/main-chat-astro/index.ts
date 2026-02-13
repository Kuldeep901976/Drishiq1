/**
 * Main Chat Astro — plug-ready Astro integration for Main Chat.
 * No identity, onboarding, UDA, payments, or visitor logic.
 *
 * Single entry: generateAstroAdviceForProblem({ problem_statement, birth_details, language?, origin? })
 * For use when: problem_statement is finalized, user has opted into astro, birth details are known.
 */

import { normalizeLanguage } from '@/lib/onboarding-concierge/regional-languages';
import { resolveBirthDetails, runAstroForMainChat } from './astro-runner';
import { formatAstroResultForUser } from './astro-response-formatter';
import type { AstroResult, BirthDetailsInput } from './types';

export type { AstroResult, BirthDetailsInput, ResolvedAstroInput } from './types';
export { resolveBirthDetails, runAstroForMainChat } from './astro-runner';
export { formatAstroResultForUser } from './astro-response-formatter';
export {
  buildAstroInterpretationSystemPrompt,
  structureIntentForMainChatAstro,
  MAIN_CHAT_ASTRO_INTENT_SYSTEM_PROMPT,
  MAIN_CHAT_ASTRO_INTENT_USER_TEMPLATE,
} from './astro-prompts';

export interface GenerateAstroAdviceParams {
  problem_statement: string;
  birth_details: BirthDetailsInput;
  language?: string;
  /** Required when birth_details.place is used (for geocode). */
  origin?: string;
}

export interface GenerateAstroAdviceResult {
  interpretation: string;
  signals: AstroResult;
}

/**
 * Full pipeline: resolve birth_details → runAstroCompute → format with LLM → return user-ready text + signals.
 * Plug-ready for Main Chat. Do not call from onboarding flow.
 */
export async function generateAstroAdviceForProblem(
  params: GenerateAstroAdviceParams
): Promise<GenerateAstroAdviceResult | null> {
  const {
    problem_statement,
    birth_details,
    language = 'en',
    origin = '',
  } = params;

  const lang = normalizeLanguage(language);

  const resolved = await resolveBirthDetails(birth_details, origin);
  if (!resolved) {
    return null;
  }

  const astroResult = await runAstroForMainChat({
    problem_statement: problem_statement.trim(),
    resolved,
  });
  if (!astroResult) {
    return null;
  }

  const interpretation = await formatAstroResultForUser({
    astroResult,
    problem_statement: problem_statement.trim(),
    language: lang,
  });

  return {
    interpretation,
    signals: astroResult,
  };
}
