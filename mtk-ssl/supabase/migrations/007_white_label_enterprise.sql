-- ============================================================================
-- Migration 007: White-Label Enterprise Features
-- ============================================================================
-- This migration extends the white-label system with:
-- - DNS verification for custom domains
-- - SSL certificate management (Let's Encrypt)
-- - Email domain verification (DKIM/SPF)
-- - Separate database instance option
-- - Enhanced branding settings

-- ============================================================================
-- DNS VERIFICATION
-- ============================================================================
CREATE TYPE dns_verification_status AS ENUM ('pending', 'verified', 'failed', 'expired');

CREATE TABLE dns_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain text NOT NULL,
  verification_token text NOT NULL,
  verification_type text NOT NULL CHECK (verification_type IN ('txt', 'cname', 'a')),
  expected_value text NOT NULL,
  status dns_verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

CREATE INDEX idx_dns_verifications_tenant_id ON dns_verifications(tenant_id);
CREATE INDEX idx_dns_verifications_domain ON dns_verifications(domain);
CREATE INDEX idx_dns_verifications_status ON dns_verifications(status);
CREATE INDEX idx_dns_verifications_expires_at ON dns_verifications(expires_at);

-- ============================================================================
-- SSL CERTIFICATES
-- ============================================================================
CREATE TYPE ssl_certificate_status AS ENUM ('pending', 'issued', 'active', 'expired', 'revoked', 'failed');

CREATE TABLE ssl_certificates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain text NOT NULL,
  certificate_url text,
  private_key_url text, -- Encrypted storage reference
  issuer text DEFAULT 'letsencrypt',
  status ssl_certificate_status NOT NULL DEFAULT 'pending',
  issued_at timestamptz,
  expires_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT true,
  last_renewed_at timestamptz,
  renewal_attempts integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

CREATE INDEX idx_ssl_certificates_tenant_id ON ssl_certificates(tenant_id);
CREATE INDEX idx_ssl_certificates_domain ON ssl_certificates(domain);
CREATE INDEX idx_ssl_certificates_status ON ssl_certificates(status);
CREATE INDEX idx_ssl_certificates_expires_at ON ssl_certificates(expires_at);

-- ============================================================================
-- EMAIL DOMAIN VERIFICATION
-- ============================================================================
CREATE TYPE email_verification_status AS ENUM ('pending', 'verified', 'failed', 'expired');

CREATE TABLE email_domain_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain text NOT NULL,
  sender_email text NOT NULL, -- e.g., no-reply@myleague.com
  dkim_public_key text,
  dkim_selector text DEFAULT 'default',
  spf_record text,
  dmarc_record text,
  status email_verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  last_checked_at timestamptz,
  verification_errors jsonb, -- Array of error messages
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

CREATE INDEX idx_email_domain_verifications_tenant_id ON email_domain_verifications(tenant_id);
CREATE INDEX idx_email_domain_verifications_domain ON email_domain_verifications(domain);
CREATE INDEX idx_email_domain_verifications_status ON email_domain_verifications(status);

-- ============================================================================
-- ENHANCED TENANT BRANDING
-- ============================================================================
-- Add new columns to tenant_branding table
ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS email_sender_name text,
  ADD COLUMN IF NOT EXISTS email_sender_address text,
  ADD COLUMN IF NOT EXISTS login_page_background_url text,
  ADD COLUMN IF NOT EXISTS login_page_custom_html text,
  ADD COLUMN IF NOT EXISTS mobile_app_icon_url text,
  ADD COLUMN IF NOT EXISTS mobile_app_splash_url text,
  ADD COLUMN IF NOT EXISTS mobile_app_bundle_id text,
  ADD COLUMN IF NOT EXISTS mobile_app_package_name text,
  ADD COLUMN IF NOT EXISTS separate_database boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS database_instance_url text;

-- ============================================================================
-- CUSTOM DOMAIN CONFIGURATION
-- ============================================================================
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS custom_domain_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS ssl_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_domain_verified boolean NOT NULL DEFAULT false;

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_dns_verifications_updated_at BEFORE UPDATE ON dns_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ssl_certificates_updated_at BEFORE UPDATE ON ssl_certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_domain_verifications_updated_at BEFORE UPDATE ON email_domain_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

