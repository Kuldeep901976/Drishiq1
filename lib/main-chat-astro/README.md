# Main Chat Astro

Reusable Astro integration layer for Main Chat. No identity, onboarding, UDA, payments, or visitor logic.

## Pipeline (aligned with Greeter Destiny Lens, simplified)

1. **Input**: `problem_statement` + `birth_details` (dob_date, dob_time, place or lat/long/timezone).
2. **Resolve**: If `birth_details.place` is given, geocode to lat/long/timezone via `resolveBirthPlaceGeo` (shared with destiny-lens).
3. **Context**: `structureIntentForMainChatAstro(problem_statement)` → `problem_context` (Main Chat–only intent prompt; not Greeter/Destiny Lens).
4. **Compute**: `runAstroCompute(...)` from `lib/astro/astro-client` (same service as Greeter).
5. **Format**: LLM prompt in `astro-prompts.ts` turns `astro_result` into user-facing explanation (advisory tone, no Destiny Lens / "options below" language).

## Essential vs onboarding-specific (from Greeter)

| Piece | Essential for Astro | Main Chat vs Greeter |
|-------|---------------------|----------------------|
| Intent structuring | Yes (problem → context) | Main Chat uses `structureIntentForMainChatAstro` (dedicated prompt); Greeter uses `intentStructuringForAstro` |
| `resolveBirthPlaceGeo` | Yes (place → geo) | Shared |
| `runAstroCompute` | Yes | No |
| `generateDestinyLensInsightBlocks` | Same idea (signals → text) | Yes (Destiny Lens framing, "options below") |
| Choice/intro messages, temp_user, UDA | No | Yes |

This module reuses only the essential parts and implements its own formatter prompt.

## Usage

```ts
import { generateAstroAdviceForProblem } from '@/lib/main-chat-astro';

const result = await generateAstroAdviceForProblem({
  problem_statement: '...',
  birth_details: {
    dob_date: '1990-01-15',
    dob_time: '08:30:00',
    place: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
  },
  language: 'en',
  origin: 'https://example.com', // required when using place
});

// result: { interpretation: string, signals: AstroResult } | null
```

When Main Chat has already resolved coordinates:

```ts
birth_details: {
  dob_date: '1990-01-15',
  dob_time: '08:30:00',
  latitude: 19.076,
  longitude: 72.8777,
  timezone: 'Asia/Kolkata',
}
```

## Test

- **POST /api/chat/problem-response** with `mode: "main_chat"` uses this module.
- **/test/problem-response** UI: choose "Main Chat" and submit to exercise the pipeline.
