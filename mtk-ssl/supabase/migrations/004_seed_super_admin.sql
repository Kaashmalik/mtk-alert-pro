-- ============================================================================
-- Migration 004: Seed Super Admin (Muhammad Kashif)
-- ============================================================================
-- This migration creates the super admin user for Muhammad Kashif
-- Email: kashif@maliktech.pk

-- Insert super admin user
-- Note: In production, this user should be created through your auth system (Clerk)
-- and then linked here. This is a seed for development/testing.
INSERT INTO users (
  id,
  email,
  tenant_ids,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  uuid_generate_v7(),
  'kashif@maliktech.pk',
  ARRAY[]::uuid[], -- Super admin doesn't need tenant_ids, they can access all
  'super_admin',
  true,
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
SET
  role = 'super_admin',
  is_active = true,
  updated_at = now();

-- Create a default tenant for SSL (Shakir Super League)
-- This is the main platform tenant
INSERT INTO tenants (
  id,
  name,
  slug,
  custom_domain,
  owner_id,
  plan,
  is_active,
  created_at,
  updated_at
)
SELECT
  uuid_generate_v7(),
  'Shakir Super League',
  'ssl',
  'ssl.cricket',
  u.id,
  'enterprise',
  true,
  now(),
  now()
FROM users u
WHERE u.email = 'kashif@maliktech.pk'
ON CONFLICT (slug) DO NOTHING;

-- Create branding for SSL tenant
INSERT INTO tenant_branding (
  tenant_id,
  logo_url,
  favicon_url,
  primary_color,
  secondary_color,
  accent_color,
  app_name,
  hide_ssl_branding,
  created_at,
  updated_at
)
SELECT
  t.id,
  'https://ssl.cricket/logo.png',
  'https://ssl.cricket/favicon.ico',
  '#1a1a1a',
  '#ffffff',
  '#00d4ff',
  'Shakir Super League',
  false, -- Don't hide branding for main tenant
  now(),
  now()
FROM tenants t
WHERE t.slug = 'ssl'
ON CONFLICT (tenant_id) DO NOTHING;

-- Add the SSL tenant to Muhammad Kashif's tenant_ids array
UPDATE users
SET
  tenant_ids = ARRAY(
    SELECT t.id FROM tenants t WHERE t.slug = 'ssl'
  )::uuid[],
  updated_at = now()
WHERE email = 'kashif@maliktech.pk';

