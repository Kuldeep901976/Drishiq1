#!/usr/bin/env node

/**
 * Supabase Database Inspector
 * Standalone utility to inspect database schema and detect duplicates
 * 
 * Usage:
 *   node index.js --url <supabase-url> --key <supabase-key>
 *   node index.js --table <table-name>
 *   node index.js --duplicates
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Simple color output without external dependencies
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class DatabaseInspector {
  constructor(url, key) {
    this.supabase = createClient(url, key);
    this.tables = [];
  }

  async getAllTables() {
    try {
      console.log(`${colors.cyan}🔍 Checking accessible tables...${colors.reset}`);
      
      // Try to get tables by attempting to query common table names
      const commonTables = [
        'blog_posts', 'testimonials', 'users', 'profiles', 'sessions',
        'invitations', 'payments', 'subscriptions', 'media', 'categories',
        'pricing_plans', 'testimonial_translations', 'blog_translations'
      ];
      
      const existingTables = [];
      
      for (const table of commonTables) {
        try {
          const { data, error } = await this.supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error) {
            const { count } = await this.supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            
            existingTables.push({ name: table, count: count || 0 });
          }
        } catch (e) {
          // Table doesn't exist or no access
        }
      }

      this.tables = existingTables.map(t => t.name);
      console.log(`${colors.green}✅ Found ${this.tables.length} accessible tables:${colors.reset}`);
      existingTables.forEach(table => {
        console.log(`  - ${colors.blue}${table.name}${colors.reset}: ${colors.green}${table.count} rows${colors.reset}`);
      });
      
      return this.tables;
    } catch (error) {
      console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
      return [];
    }
  }

  async getTableSchema(tableName) {
    try {
      console.log(`${colors.cyan}\n📋 Analyzing table: ${colors.bright}${tableName}${colors.reset}`);
      
      // Get row count
      const { count, error: countError } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error(`${colors.red}❌ Error fetching count:${colors.reset}`, countError.message);
        return null;
      }

      // Get sample data
      const { data: sample, error: sampleError } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (sampleError) {
        console.error(`${colors.red}❌ Error fetching sample data:${colors.reset}`, sampleError.message);
        return null;
      }

      const schema = {
        tableName,
        columns: sample && sample.length > 0 ? Object.keys(sample[0]) : [],
        rowCount: count || 0,
        sample: sample || []
      };

      this.displayTableSchema(schema);
      return schema;

    } catch (error) {
      console.error(`${colors.red}❌ Error analyzing table ${tableName}:${colors.reset}`, error.message);
      return null;
    }
  }

  displayTableSchema(schema) {
    const { tableName, columns, rowCount, sample } = schema;

    console.log(`${colors.bright}\n📊 Table: ${colors.blue}${tableName}${colors.reset}`);
    console.log(`${colors.cyan}📈 Row Count: ${colors.green}${rowCount.toLocaleString()}${colors.reset}`);
    
    if (columns.length > 0) {
      console.log(`${colors.bright}\n📋 Columns (${columns.length}):${colors.reset}`);
      
      // Group columns by type
      const regularCols = columns.filter(col => !col.match(/_([a-z]{2})$/i));
      const translationCols = columns.filter(col => col.match(/_([a-z]{2})$/i));
      
      if (regularCols.length > 0) {
        console.log(`${colors.white}Regular columns:${colors.reset}`);
        regularCols.forEach(col => {
          console.log(`  ${colors.blue}${col}${colors.reset}`);
        });
      }

      if (translationCols.length > 0) {
        console.log(`\n${colors.green}🌐 Translation columns (${translationCols.length}):${colors.reset}`);
        
        // Group by base field
        const translationGroups = new Map();
        translationCols.forEach(col => {
          const match = col.match(/^(.+)_([a-z]{2})$/i);
          if (match) {
            const [, baseField, lang] = match;
            if (!translationGroups.has(baseField)) {
              translationGroups.set(baseField, []);
            }
            translationGroups.get(baseField).push({ lang, col });
          }
        });

        translationGroups.forEach((langs, baseField) => {
          console.log(`\n  ${colors.bright}${baseField}:${colors.reset}`);
          langs.forEach(({ lang, col }) => {
            console.log(`    ${colors.green}${lang}${colors.reset}: ${colors.blue}${col}${colors.reset}`);
          });
        });
      }
    }

    // Show sample data
    if (sample.length > 0) {
      console.log(`${colors.bright}\n📝 Sample data:${colors.reset}`);
      console.log(JSON.stringify(sample[0], null, 2));
    }
  }

  async checkDuplicates(tableName, columns = []) {
    try {
      console.log(`${colors.cyan}\n🔍 Checking for duplicates in table: ${colors.bright}${tableName}${colors.reset}`);
      
      if (columns.length === 0) {
        // Get sample data to determine columns
        const { data: sample, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`${colors.red}❌ Error fetching columns:${colors.reset}`, error.message);
          return;
        }
        
        columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
      }

      console.log(`Checking columns: ${colors.blue}${columns.join(', ')}${colors.reset}`);

      // Get all data
      const { data: allData, error } = await this.supabase
        .from(tableName)
        .select(columns.join(','));

      if (error) {
        console.error(`${colors.red}❌ Error checking duplicates:${colors.reset}`, error.message);
        return;
      }

      // Count occurrences
      const counts = new Map();
      allData.forEach(row => {
        const key = columns.map(col => row[col]).join('|');
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      // Find actual duplicates
      const duplicateEntries = Array.from(counts.entries())
        .filter(([key, count]) => count > 1)
        .map(([key, count]) => {
          const values = key.split('|');
          return {
            values: columns.reduce((obj, col, index) => {
              obj[col] = values[index];
              return obj;
            }, {}),
            count
          };
        });

      if (duplicateEntries.length === 0) {
        console.log(`${colors.green}✅ No duplicates found!${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Found ${duplicateEntries.length} duplicate groups:${colors.reset}`);
        duplicateEntries.forEach((entry, index) => {
          console.log(`${colors.yellow}\n${index + 1}. Count: ${entry.count}${colors.reset}`);
          Object.entries(entry.values).forEach(([col, val]) => {
            console.log(`   ${colors.blue}${col}${colors.reset}: ${colors.white}${val}${colors.reset}`);
          });
        });
      }

      return duplicateEntries;

    } catch (error) {
      console.error(`${colors.red}❌ Error checking duplicates:${colors.reset}`, error.message);
      return [];
    }
  }

  async run(options) {
    console.log(`${colors.bright}${colors.cyan}🔍 Supabase Database Inspector${colors.reset}`);
    console.log(`${colors.cyan}=====================================${colors.reset}\n`);

    try {
      if (options.table) {
        // Check specific table
        await this.getTableSchema(options.table);
        if (options.duplicates) {
          await this.checkDuplicates(options.table);
        }
      } else {
        // Check all tables
        const tables = await this.getAllTables();
        
        for (const table of tables) {
          await this.getTableSchema(table);
          if (options.duplicates) {
            await this.checkDuplicates(table);
          }
        }
      }

      console.log(`${colors.green}\n✅ Database inspection completed!${colors.reset}`);

    } catch (error) {
      console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error.message);
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    table: null,
    duplicates: false,
    help: false,
    url: null,
    key: null,
    envFile: '.env.local'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--table' || arg === '-t') {
      options.table = args[i + 1];
      i++; // Skip next argument as it's the table name
    } else if (arg === '--duplicates' || arg === '-d') {
      options.duplicates = true;
    } else if (arg === '--url' || arg === '-u') {
      options.url = args[i + 1];
      i++;
    } else if (arg === '--key' || arg === '-k') {
      options.key = args[i + 1];
      i++;
    } else if (arg === '--env-file') {
      options.envFile = args[i + 1];
      i++;
    }
  }

  return options;
}

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
    console.warn(`${colors.yellow}⚠️  Warning: Could not load ${filePath}${colors.reset}`);
  }
}

// Show help
function showHelp() {
  console.log(`${colors.bright}Supabase Database Inspector${colors.reset}`);
  console.log(`${colors.cyan}==========================${colors.reset}\n`);
  
  console.log(`${colors.bright}Usage:${colors.reset}`);
  console.log(`  node index.js [options]\n`);
  
  console.log(`${colors.bright}Options:${colors.reset}`);
  console.log(`  ${colors.blue}-h, --help${colors.reset}           Show this help message`);
  console.log(`  ${colors.blue}-u, --url <url>${colors.reset}     Supabase project URL`);
  console.log(`  ${colors.blue}-k, --key <key>${colors.reset}     Supabase anon key`);
  console.log(`  ${colors.blue}-t, --table <name>${colors.reset}   Inspect specific table`);
  console.log(`  ${colors.blue}-d, --duplicates${colors.reset}     Check for duplicates`);
  console.log(`  ${colors.blue}--env-file <file>${colors.reset}   Environment file path (default: .env.local)\n`);
  
  console.log(`${colors.bright}Examples:${colors.reset}`);
  console.log(`  ${colors.green}node index.js${colors.reset}                                    # Check all tables`);
  console.log(`  ${colors.green}node index.js --table blog_posts${colors.reset}                 # Check specific table`);
  console.log(`  ${colors.green}node index.js --duplicates${colors.reset}                        # Check for duplicates`);
  console.log(`  ${colors.green}node index.js -t testimonials -d${colors.reset}                  # Check testimonials for duplicates`);
  console.log(`  ${colors.green}node index.js --env-file ../drishiq\\ 1/.env.local${colors.reset} # Use custom env file`);
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }

  // Load environment variables if no URL/key provided
  if (!options.url || !options.key) {
    loadEnvFile(options.envFile);
  }

  const url = options.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = options.key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(`${colors.red}❌ Error: Missing Supabase URL or key${colors.reset}`);
    console.error('Please provide --url and --key options or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment file');
    process.exit(1);
  }

  const inspector = new DatabaseInspector(url, key);
  await inspector.run(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseInspector;




