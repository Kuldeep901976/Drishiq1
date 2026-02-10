/**
 * Meet Yourself persona types and config.
 * Valid [type] segments match app/meet-yourself subdirs.
 */

export interface PersonaConfig {
  namespace: string;
  translationKey: string;
  type: string;
}

const PERSONA_TYPES = [
  'builder',
  'connector',
  'dependent',
  'escaper',
  'giver',
  'giving-beyond',
  'problem-carrier',
  'rebooter',
  'seeker',
  'solo',
] as const;

const PERSONA_CONFIGS: Record<string, PersonaConfig> = Object.fromEntries(
  PERSONA_TYPES.map((type) => [
    type,
    {
      namespace: 'meet-yourself',
      translationKey: type,
      type,
    },
  ])
);

export function isValidPersonaType(type: string): type is (typeof PERSONA_TYPES)[number] {
  return PERSONA_TYPES.includes(type as (typeof PERSONA_TYPES)[number]);
}

export function getPersonaConfig(type: string): PersonaConfig | undefined {
  return PERSONA_CONFIGS[type];
}
