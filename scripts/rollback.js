import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { env } from '../src/shared/env.js';

async function rollbackMigration(filename) {
  console.log(`🔄 Rolling back migration: ${filename}`);
  
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  try {
    const migrationFile = path.join(migrationsDir, filename);
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file ${filename} not found`);
      process.exit(1);
    }
    
    // For now, we'll just remove the migration record
    // In a real production system, you'd have separate rollback SQL files
    console.log(`⚠️  WARNING: This only removes the migration record. Manual cleanup may be required.`);
    
    const { error } = await supabase
      .from('schema_migrations')
      .delete()
      .eq('filename', filename);
    
    if (error) {
      console.error('❌ Failed to remove migration record:', error);
      throw error;
    }
    
    console.log(`✅ Migration ${filename} record removed`);
    console.log('⚠️  Please manually verify and clean up any database changes');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const filename = process.argv[2];

if (!filename) {
  console.error('❌ Usage: node scripts/rollback.js <migration-filename>');
  console.error('Example: node scripts/rollback.js 001_normalize_schema.sql');
  process.exit(1);
}

// Run rollback if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  rollbackMigration(filename);
}

export { rollbackMigration };
