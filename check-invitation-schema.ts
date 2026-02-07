import { createClient } from '@supabase/supabase-js';
// import dotenv from 'dotenv';

// dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkInvitationSchema() {
  console.log('🔍 Checking invitations table schema...\n');

  try {
    // Check table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'invitations')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Error fetching columns:', columnsError);
      return;
    }

    console.log('📋 Table Structure:');
    console.log('==================');
    columns?.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'} ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
    });

    // Check existing categories
    const { data: categories, error: categoriesError } = await supabase
      .from('invitations')
      .select('category')
      .not('category', 'is', null);

    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
      return;
    }

    console.log('\n🏷️  Existing Categories:');
    console.log('======================');
    const uniqueCategories = [...new Set(categories?.map(c => c.category))];
    uniqueCategories.forEach(cat => {
      const count = categories?.filter(c => c.category === cat).length;
      console.log(`${cat}: ${count} invitations`);
    });

    // Check sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('invitations')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError);
      return;
    }

    console.log('\n📊 Sample Data:');
    console.log('================');
    sampleData?.forEach((invitation, index) => {
      console.log(`\nInvitation ${index + 1}:`);
      Object.entries(invitation).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkInvitationSchema();
