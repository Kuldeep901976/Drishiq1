{
  "scripts": {
  "setup:supabase": "node scripts/setup-supabase.js"
}
}const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Supabase credentials are missing in .env file');
    process.exit(1);
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Test the connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      throw error;
    }

    console.log('✅ Supabase connection successful');
    
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    process.exit(1);
  }
}

setupSupabase();
