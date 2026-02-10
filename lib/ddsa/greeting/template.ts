/**
 * Greeting template for DDSA. Builds preview text from inputs.
 */

export interface GreetingInputs {
  brand?: string;
  name?: string;
  city?: string;
  timezone?: string;
  role?: string;
  lastGoal?: string;
  astro?: { sun?: string; moon?: string };
}

export function buildGreetingPreview(inputs: GreetingInputs): string {
  const parts: string[] = [];
  if (inputs.name) parts.push(`Hi ${inputs.name}`);
  if (inputs.city) parts.push(`from ${inputs.city}`);
  if (inputs.role) parts.push(`(${inputs.role})`);
  if (inputs.lastGoal) parts.push(`— goal: ${inputs.lastGoal}`);
  if (inputs.astro?.sun) parts.push(`Sun: ${inputs.astro.sun}`);
  if (inputs.astro?.moon) parts.push(`Moon: ${inputs.astro.moon}`);
  return parts.length ? parts.join(' ') : 'Hello!';
}
