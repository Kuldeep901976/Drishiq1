/**
 * Cloudflare Workers Environment Type Definition
 * Defines the shape of env object available in Cloudflare Workers/Pages Functions
 */

export interface Env {
  // R2 Bucket Binding
  DRISHIQ_UPLOADS: R2Bucket;

  // Durable Objects (for future use)
  CONVERSATION_SESSIONS?: DurableObjectNamespace;

  // Environment Variables (from wrangler.toml [vars])
  NODE_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_POOLER_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_FIREBASE_API_KEY?: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  NEXT_PUBLIC_FIREBASE_APP_ID?: string;
  NEXT_PUBLIC_GA_ID?: string;
  ADMIN_AUTH_URL?: string;
  R2_PUBLIC_BASE_URL?: string;

  // Secrets (set via wrangler secret put or dashboard)
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY?: string;
  R2_BUCKET_NAME?: string;
}

