import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { env } from '../src/shared/env.js';

async function runMigrations() {
  console.log('🔄 Starting database migrations...');
  
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  try {
    // Get migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('✅ No migration files found');
      return;
    }
    
    // Create migrations table if it doesn't exist
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          filename TEXT PRIMARY KEY,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    // Get executed migrations
    const { data: executedMigrations } = await supabase
      .from('schema_migrations')
      .select('filename');
    
    const executedFiles = new Set(executedMigrations?.map(m => m.filename) || []);
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (executedFiles.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`📄 Running ${file}...`);
      
      const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute migration
      const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
      
      if (error) {
        console.error(`❌ Migration ${file} failed:`, error);
        throw error;
      }
      
      // Record migration
      await supabase
        .from('schema_migrations')
        .insert({ filename: file });
      
      console.log(`✅ Migration ${file} completed`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };
