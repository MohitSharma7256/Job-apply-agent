# Database Migrations Runbook

## Overview

This runbook covers procedures for managing database migrations in the Job Apply Agent system using Supabase and custom migration scripts.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Migration      │    │   Supabase DB    │    │   Application   │
│   Scripts        │◄──►│   PostgreSQL     │◄──►│   Services      │
│                 │    │ + RLS Policies   │    │ + ORM Layer     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Migration Files

| File | Purpose | Version |
|------|---------|---------|
| `001_normalize_schema.sql` | Normalize table names and add UUID primary keys | v1.0 |
| `002_enable_rls_policies.sql` | Enable Row Level Security policies | v1.0 |
| `003_add_job_tracking.sql` | Add job tracking and metrics tables | v1.1 |
| `004_add_audit_fields.sql` | Add audit fields and timestamps | v1.1 |

## Migration Management

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Run specific migration
npm run migrate -- --file 001_normalize_schema.sql

# Run migrations in dry-run mode
npm run migrate -- --dry-run
```

### Migration Status

```bash
# Check migration status
npm run migrate -- --status

# View applied migrations
npm run migrate -- --list

# Check pending migrations
npm run migrate -- --pending
```

### Rolling Back Migrations

```bash
# Rollback last migration
npm run migrate:rollback

# Rollback to specific version
npm run migrate:rollback -- --to 001_normalize_schema.sql

# Rollback specific migration
npm run migrate:rollback -- --file 002_enable_rls_policies.sql
```

## Pre-Migration Checklist

### Environment Validation

```bash
# Check database connection
curl -f http://localhost:3000/api/health

# Verify Supabase credentials
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-10

# Check current schema version
npm run migrate -- --status
```

### Backup Procedures

```bash
# Create database backup
npm run db:backup

# Export current schema
npm run db:export-schema

# Backup critical tables
npm run db:backup -- --tables user_profiles,jobs,applications
```

### Rollback Planning

```bash
# Test rollback procedure
npm run migrate:rollback -- --dry-run

# Verify rollback script exists
ls migrations/rollback_*.sql

# Check rollback dependencies
npm run migrate:rollback -- --check-deps
```

## Migration Procedures

### Standard Migration

**1. Preparation**
```bash
# Create new migration file
npm run migrate:create -- --name add_new_feature --version 1.2

# Review migration template
cat migrations/005_add_new_feature.sql
```

**2. Development**
```bash
# Write migration SQL
# Include:
# - DDL statements
# - Data migrations
# - Index creation
# - RLS policy updates
```

**3. Testing**
```bash
# Test in development environment
npm run migrate -- --file 005_add_new_feature.sql

# Verify results
npm run db:verify -- --migration 005_add_new_feature.sql

# Test rollback
npm run migrate:rollback -- --file 005_add_new_feature.sql
```

**4. Deployment**
```bash
# Create backup
npm run db:backup

# Run migration
npm run migrate -- --file 005_add_new_feature.sql

# Verify success
npm run db:verify -- --migration 005_add_new_feature.sql
```

### Data Migration

**1. Analysis**
```bash
# Analyze data volume
npm run db:analyze -- --table user_profiles

# Check data quality
npm run db:validate -- --table user_profiles

# Estimate migration time
npm run db:estimate -- --migration data_migration.sql
```

**2. Preparation**
```bash
# Create staging tables
npm run db:create-staging -- --source user_profiles

# Test data transformation
npm run db:test-transform -- --migration data_migration.sql
```

**3. Execution**
```bash
# Run in batches for large tables
npm run migrate -- --file data_migration.sql -- --batch-size 1000

# Monitor progress
npm run migrate:monitor -- --file data_migration.sql

# Verify data integrity
npm run db:verify -- --migration data_migration.sql
```

### Schema Migration

**1. Impact Analysis**
```bash
# Check dependent objects
npm run db:analyze-deps -- --table user_profiles

# Identify breaking changes
npm run db:check-breaking -- --migration schema_change.sql

# Test application compatibility
npm run test:integration -- --migration schema_change.sql
```

**2. Zero-Downtime Strategy**
```bash
# Create new version of tables
npm run db:create-v2 -- --table user_profiles

# Sync data to new tables
npm run db:sync -- --from user_profiles --to user_profiles_v2

# Update application to use new tables
# Deploy application changes

# Switch to new tables
npm run db:switch -- --from user_profiles --to user_profiles_v2

# Clean up old tables
npm run db:cleanup -- --table user_profiles
```

## Troubleshooting

### Migration Failures

**Symptoms:**
- Migration script errors
- Partial schema changes
- Application errors

**Diagnostics:**
```bash
# Check migration logs
tail -f logs/migration.log

# Verify current state
npm run migrate -- --status

# Check database constraints
npm run db:check-constraints
```

**Solutions:**
1. **Identify Failed Statement**
   ```bash
   # Review migration file
   cat migrations/005_failed_migration.sql
   
   # Check error details
   npm run migrate -- --file 005_failed_migration.sql -- --verbose
   ```

2. **Manual Correction**
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Manually fix issues
   # Example: DROP CONSTRAINT IF EXISTS conflicting_constraint;
   ```

3. **Resume Migration**
   ```bash
   # Continue from failed point
   npm run migrate -- --file 005_failed_migration.sql -- --resume
   ```

### Rollback Failures

**Symptoms:**
- Rollback script errors
- Data inconsistency
- Application crashes

**Diagnostics:**
```bash
# Check rollback logs
tail -f logs/rollback.log

# Verify current schema
npm run db:schema-diff

# Check data integrity
npm run db:verify-integrity
```

**Solutions:**
1. **Manual Rollback**
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Manually execute rollback steps
   # Example: ALTER TABLE user_profiles DROP COLUMN new_column;
   ```

2. **Data Recovery**
   ```bash
   # Restore from backup
   npm run db:restore -- --backup pre-migration-backup.sql
   
   # Re-run migration if needed
   npm run migrate -- --file 005_failed_migration.sql
   ```

### Performance Issues

**Symptoms:**
- Slow migration execution
- Database locks
- Application timeouts

**Diagnostics:**
```bash
# Check active locks
npm run db:check-locks

# Monitor query performance
npm run db:monitor-queries

# Check system resources
top -p $(pgrep postgres)
```

**Solutions:**
1. **Optimize Migration**
   ```bash
   # Add indexes before data migration
   # Use batch processing for large tables
   # Disable triggers during migration
   ```

2. **Reduce Lock Time**
   ```bash
   # Run during low-traffic periods
   # Use shorter transactions
   # Add appropriate indexes
   ```

## Emergency Procedures

### Migration Rollback

**Impact:** Schema or data inconsistency
**Priority:** Critical

**Immediate Actions:**
1. **Stop Application**
   ```bash
   # Stop all services
   pkill -f "node server.js"
   pkill -f "node workers/index.js"
   ```

2. **Assess Damage**
   ```bash
   # Check migration status
   npm run migrate -- --status
   
   # Verify data integrity
   npm run db:verify-integrity
   ```

3. **Execute Rollback**
   ```bash
   # Rollback to last known good state
   npm run migrate:rollback -- --to 004_add_audit_fields.sql
   ```

4. **Verify Recovery**
   ```bash
   # Test application
   npm run test:integration
   
   # Restart services
   npm start &
   npm run worker &
   ```

### Data Corruption

**Impact:** Data loss or inconsistency
**Priority:** Critical

**Recovery Actions:**
1. **Stop All Operations**
   ```bash
   pkill -f "node server.js"
   pkill -f "node workers/index.js"
   ```

2. **Assess Extent**
   ```bash
   # Check data integrity
   npm run db:verify-integrity
   
   # Identify affected tables
   npm run db:check-corruption
   ```

3. **Restore from Backup**
   ```bash
   # Restore latest backup
   npm run db:restore -- --backup latest-backup.sql
   
   # Verify restoration
   npm run db:verify-backup
   ```

4. **Recover Lost Data**
   ```bash
   # Check transaction logs
   npm run db:recover-from-wal
   
   # Manual data entry if needed
   ```

## Maintenance Procedures

### Regular Tasks

**Daily:**
```bash
# Check migration status
npm run migrate -- --status

# Monitor database performance
npm run db:monitor-performance
```

**Weekly:**
```bash
# Backup database
npm run db:backup

# Check for long-running transactions
npm run db:check-long-transactions
```

**Monthly:**
```bash
# Archive old data
npm run db:archive -- --older-than 90d

# Update statistics
npm run db:update-stats

# Rebuild indexes if needed
npm run db:rebuild-indexes
```

### Performance Optimization

**Index Management:**
```bash
# Analyze query performance
npm run db:analyze-queries

# Add missing indexes
npm run db:add-missing-indexes

# Remove unused indexes
npm run db:remove-unused-indexes
```

**Table Maintenance:**
```bash
# Vacuum analyze tables
npm run db:vacuum-analyze

# Rebuild fragmented tables
npm run db:rebuild-table -- --table large_table
```

## Security Considerations

### Access Control

**Migration Permissions:**
```bash
# Use service role key for migrations
export SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Never use anon key for migrations
# Never expose service key in client code
```

**Audit Trail:**
```bash
# Log all migration activities
npm run migrate -- --audit-log

# Review migration history
npm run migrate:history
```

### Data Protection

**Sensitive Data:**
```bash
# Mask sensitive data in logs
npm run migrate -- --mask-sensitive

# Encrypt sensitive columns
npm run db:encrypt-column -- --table user_profiles --column ssn
```

## Testing Procedures

### Unit Testing

```bash
# Test migration scripts
npm test -- migrations/

# Test rollback scripts
npm test -- migrations/rollback/
```

### Integration Testing

```bash
# Test with sample data
npm run migrate:test -- --with-sample-data

# Test application compatibility
npm run test:integration -- --migration 005_new_migration.sql
```

### Performance Testing

```bash
# Test migration performance
npm run migrate:test-performance -- --file large_migration.sql

# Benchmark database operations
npm run db:benchmark -- --table user_profiles
```

## Documentation

### Migration Documentation

Each migration should include:
- Purpose and scope
- Breaking changes
- Rollback procedure
- Performance impact
- Testing requirements

### Change Log

Maintain change log in `MIGRATIONS.md`:
```markdown
## 2024-01-15 - v1.2.0
- Added job tracking tables
- Updated RLS policies
- Performance improvements
```

## Scripts and Tools

### Migration Scripts

```bash
# Create new migration
npm run migrate:create -- --name feature_name --version 1.2

# Validate migration
npm run migrate:validate -- --file 005_migration.sql

# Dry run migration
npm run migrate -- --dry-run -- --file 005_migration.sql
```

### Database Tools

```bash
# Schema diff
npm run db:schema-diff -- --from production -- --to development

# Data comparison
npm run db:compare-data -- --table user_profiles

# Performance analysis
npm run db:analyze-performance -- --table jobs
```

## Contact Information

- **Database Team**: db-team@company.com
- **On-call DBA**: +1-555-987-6543
- **Slack Channel**: #database-operations

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Migration Guide](https://www.postgresql.org/docs/current/migration.html)
- [Database Architecture Guide](../architecture.md)
- [Incident Response Runbook](incident-response.md)
