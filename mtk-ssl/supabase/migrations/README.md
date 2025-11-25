# SSL Database Migrations

This directory contains all database migrations for the Shakir Super League (SSL) multi-tenant platform.

## Migration Order

Migrations must be run in the following order:

1. **001_enable_uuid_v7_and_helpers.sql** - Enables UUID v7 generation and creates helper functions
2. **002_create_tables.sql** - Creates all database tables
3. **003_create_rls_policies.sql** - Enables RLS and creates security policies
4. **004_seed_super_admin.sql** - Seeds Muhammad Kashif as super admin

## Key Features

### Multi-Tenant Architecture
- Every league is a tenant with complete data isolation
- Users can belong to multiple leagues (tenant_id[] array)
- Row Level Security (RLS) ensures 100% data isolation

### Super Admin
- Muhammad Kashif (kashif@maliktech.pk) has global access
- Super admin can access all tenants and data
- Implemented via `is_super_admin()` helper function

### Helper Functions

#### `uuid_generate_v7()`
- Generates time-ordered UUIDs (better for database indexes)
- Used as default for all primary keys

#### `current_tenant_id()`
- Returns array of tenant IDs the current user belongs to
- Works with Supabase auth.uid() or JWT email

#### `is_super_admin()`
- Checks if current user is super admin
- Returns true for kashif@maliktech.pk

#### `current_user_id()`
- Returns current user ID from auth.uid()

#### `user_belongs_to_tenant(tenant_uuid)`
- Checks if user belongs to a specific tenant
- Super admin always returns true

## Tables

### Core Tables
- `tenants` - League/tenant information
- `tenant_branding` - White-label configuration
- `users` - Multi-tenant users
- `profiles` - Public user profiles per tenant

### Tournament Tables
- `tournaments` - Tournament/league information
- `teams` - Teams participating in tournaments
- `players` - Players with stats and roles
- `venues` - Match venues

### Match Tables
- `matches` - Match information
- `match_innings` - Innings data
- `match_balls` - Ball-by-ball scoring data

### Media & Documents
- `documents` - League documents (rules, forms, etc.)
- `media` - Images, videos, highlights

## Security

All tables have RLS enabled with policies that:
1. Allow super admin full access
2. Restrict normal users to their tenant data only
3. Use `tenant_id` for data isolation

## Usage

### Running Migrations

```bash
# Using Supabase CLI
supabase db reset

# Or apply migrations manually
psql $DATABASE_URL -f 001_enable_uuid_v7_and_helpers.sql
psql $DATABASE_URL -f 002_create_tables.sql
psql $DATABASE_URL -f 003_create_rls_policies.sql
psql $DATABASE_URL -f 004_seed_super_admin.sql
```

### Querying with Tenant Isolation

```sql
-- This query automatically filters by tenant_id via RLS
SELECT * FROM tournaments WHERE status = 'live';

-- Super admin can see all
-- Normal users only see their tenants
```

### Creating a New Tenant

```sql
-- 1. Create tenant
INSERT INTO tenants (name, slug, owner_id, plan)
VALUES ('My League', 'my-league', current_user_id(), 'pro')
RETURNING id;

-- 2. Add user to tenant
UPDATE users
SET tenant_ids = array_append(tenant_ids, 'tenant-uuid-here')
WHERE id = current_user_id();
```

## Notes

- All IDs use UUID v7 (time-ordered)
- All tables have `created_at` and `updated_at` timestamps
- Foreign keys use CASCADE or SET NULL appropriately
- Indexes are created for common query patterns
- RLS policies are comprehensive and secure

