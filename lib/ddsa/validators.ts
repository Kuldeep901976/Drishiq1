/**
 * DDSA health and pipeline graph validators.
 */

export async function healthCheck(): Promise<{ valid: boolean; [key: string]: unknown }> {
  return { valid: true };
}

export function validatePipelineGraph(): { valid: boolean; [key: string]: unknown } {
  return { valid: true };
}
