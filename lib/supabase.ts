import { createClient } from '@supabase/supabase-js'

// Load dotenv if environment variables are not set (for standalone scripts)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  try {
    // Use require to ensure synchronous loading
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
    dotenv.config(); // Also try .env
  } catch (e) {
    // dotenv might not be available, that's okay if env vars are set elsewhere
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required. Make sure .env.local exists and contains NEXT_PUBLIC_SUPABASE_URL.');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Make sure .env.local exists and contains NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  }
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
  }
  return createClient(supabaseUrl, serviceRoleKey)
}

















