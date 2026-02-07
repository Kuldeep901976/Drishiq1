# Onboarding Adapter Integration - PR Bundle

## Branch
```
feature/onboarding-adapter
```

## Overview
This PR implements a non-invasive adapter pattern to safely reuse main-chat stages in the onboarding pipeline without modifying any main chat code.

## Changes Summary

### New Files
- `lib/ddsa/adapters/main-stage-adapter.ts` - Safe read-only execution of main-chat stages
- `lib/ddsa/onboarding-stage-registry.ts` - Composes main registry, keeps onboarding entries separate
- `database/migrations/20241219_add_onboarding_stages.sql` - Idempotent migration for onboarding stages
- `onboarding-stage-map.json` - Comprehensive stage mapping and safety analysis
- `tests/unit/main-stage-adapter.test.ts` - Unit tests for adapter
- `tests/integration/onboarding-pipeline-executor.test.ts` - Integration tests
- `tests/e2e/onboarding-flow-e2e.test.ts` - E2E tests

### Modified Files
- `lib/ddsa/onboarding-pipeline-executor.ts` - Uses adapter and onboarding registry

## Safety Guarantees
✅ No main chat code changes
✅ Read-only execution with sandboxing
✅ Database isolation (onboarding vs main chat)
✅ Context flags (`isOnboarding`, `sandboxMode`)

## Testing
See `PR_BUNDLE/TESTING.md` for detailed testing instructions.

## Migration
Run: `psql -d your_database -f database/migrations/20241219_add_onboarding_stages.sql`

## Feature Flag
Set `FEATURE_ONBOARDING_PIPELINE=true` to enable (optional, for gradual rollout).



