# Patch Files for DDSA Multi-Tenant Migration

## Overview

These patches resolve conflicts and blockers identified in the audit report.

## Patch Files

### 001-consolidate-orchestrators.patch
**Priority**: HIGH  
**Description**: Updates `dynamic-stage-selector.ts` to use `questioning_orchestrator.ts` instead of deprecated `question-orchestrator.ts`  
**Status**: Required before merge

### 002-update-responses-client-tenant.patch
**Priority**: MEDIUM  
**Description**: Adds tenant support to `responsesClient.ts` - accepts optional `tenantId` parameter and resolves API keys from tenant config  
**Status**: Recommended before merge

### 003-background-scheduler-tenant.patch
**Priority**: MEDIUM  
**Description**: Ensures tenant context is set for RLS before background stage execution  
**Status**: Recommended before merge

### 004-audit-logging-redaction.patch
**Priority**: LOW  
**Description**: Integrates PII redaction into audit logging based on tenant privacy settings  
**Status**: Optional, can be done post-merge

## Application Instructions

```bash
# Apply patches (in order)
git apply patches/001-consolidate-orchestrators.patch
git apply patches/002-update-responses-client-tenant.patch
git apply patches/003-background-scheduler-tenant.patch
git apply patches/004-audit-logging-redaction.patch

# Or apply all at once
cat patches/*.patch | git apply
```

## Verification

After applying patches:
1. Run TypeScript compiler: `tsc --noEmit`
2. Run tests: `npm test`
3. Verify no conflicts: `git status`

