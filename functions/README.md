# Cloudflare Workers Functions

This directory contains Cloudflare Pages Functions that run at the edge.

## Structure

- `api/health.ts` - Health check endpoint to verify environment variables
- `api/upload-intent.ts` - Upload intent endpoint using R2 storage
- `storage/r2Adapter.worker.ts` - R2 adapter for Cloudflare Workers
- `types/env.d.ts` - Type definitions for Cloudflare Workers environment

## Setup

1. Ensure your `wrangler.toml` is configured with:
   - R2 bucket binding: `DRISHIQ_UPLOADS`
   - Environment variables in `[vars]` section
   - Secrets set via `wrangler secret put` or Cloudflare dashboard

2. Install dependencies (if needed):
   ```bash
   npm install @cloudflare/workers-types
   ```

## Testing Locally

### Option 1: Using Pages Dev (Recommended for Functions)

Run the test script:

```bash
# PowerShell
.\test-functions.ps1

# Or manually:
npx wrangler pages dev .test-static --config wrangler.test.toml --port 8787
```

This will:
- Create a minimal static directory if needed
- Start Pages dev server with Functions support
- Make Functions available at `http://127.0.0.1:8787`

### Option 2: Using Wrangler Dev (Full Next.js)

For full Next.js app with Functions:

```bash
npx wrangler dev
```

**Note**: This requires the Next.js build output (`.open-next/worker.js`). Use Option 1 for testing Functions only.

### Test Endpoints

- Health check: `http://127.0.0.1:8787/api/health`
- Upload intent: `POST http://127.0.0.1:8787/api/upload-intent`

## Environment Variables

Required environment variables (set in `wrangler.toml` or as secrets):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret)
- `R2_PUBLIC_BASE_URL` - Public CDN URL for R2 assets
- `R2_BUCKET_NAME` - R2 bucket name
- `OPENAI_API_KEY` - OpenAI API key (secret, optional for upload-intent)

## Notes

- The R2 adapter currently uses a placeholder for presigned URLs (`r2://` prefix)
- For production, implement proper AWS Signature v4 presigned URL generation
- The upload-intent endpoint writes to `file_uploads` table via Supabase REST API

