#!/usr/bin/env node

/**
 * Simple Database Check for Supabase
 * Works with anon key permissions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from file
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  } catch (error) {
    console.error('❌ Error loading env file:', error.message);
    process.exit(1);
  }
}

// Load environment variables
loadEnvFile('../drishiq 1/.env.local');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTable(tableName) {
  try {
    console.log(`🔍 Checking table: ${tableName}\n`);

    // Get row count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error fetching count:', countError.message);
      return;
    }

    // Get sample data
    const { data: sample, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error fetching sample data:', sampleError.message);
      return;
    }

    console.log(`📊 Table: ${tableName}`);
    console.log(`📈 Row count: ${count || 0}`);
    
    if (sample && sample.length > 0) {
      console.log(`\n📋 Columns found:`);
      const columns = Object.keys(sample[0]);
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });

      // Check for translation columns
      const translationCols = columns.filter(col => 
        col.match(/_([a-z]{2})$/i)
      );
      
      if (translationCols.length > 0) {
        console.log(`\n🌐 Translation columns (${translationCols.length}):`);
        translationCols.forEach(col => {
          console.log(`  ${col}`);
        });
      }

      console.log('\n📝 Sample data:');
      console.log(JSON.stringify(sample[0], null, 2));
    } else {
      console.log('📝 No data found in table');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function listTables() {
  try {
    console.log('🔍 Checking accessible tables...\n');

    const commonTables = [
      'blog_posts', 'testimonials', 'users', 'profiles', 'sessions',
      'invitations', 'payments', 'subscriptions', 'media', 'categories',
      'pricing_plans', 'testimonial_translations', 'blog_translations'
    ];
    
    const existingTables = [];
    
    for (const table of commonTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          existingTables.push({ name: table, count: count || 0 });
        }
      } catch (e) {
        // Table doesn't exist or no access
      }
    }

    console.log(`📋 Found ${existingTables.length} accessible tables:`);
    existingTables.forEach(table => {
      console.log(`  ${table.name}: ${table.count} rows`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main execution
async function main() {
  const tableName = process.argv[2];
  
  if (tableName) {
    await checkTable(tableName);
  } else {
    await listTables();
  }
}

main().catch(console.error);




