-- ============================================================================
-- Migration 006: Create Admin Tables
-- ============================================================================
-- This migration creates tables for super admin dashboard features:
-- - Subscriptions & Payments (revenue tracking)
-- - Announcements (global broadcasts)
-- - Feature Flags
-- - System Health & Error Logs
-- - Commission Rates
-- - White-label Approval Queue

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'paused');
CREATE TYPE payment_method AS ENUM ('jazzcash', 'easypaisa', 'stripe', 'bank_transfer');

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  status subscription_status NOT NULL DEFAULT 'active',
  monthly_amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  payment_method payment_method,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'PKR',
  payment_method payment_method NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  external_payment_id text,
  commission_amount decimal(10, 2),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================
CREATE TYPE announcement_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE announcement_type AS ENUM ('info', 'warning', 'success', 'error', 'maintenance');

CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  title text NOT NULL,
  message text NOT NULL,
  type announcement_type NOT NULL DEFAULT 'info',
  priority announcement_priority NOT NULL DEFAULT 'medium',
  is_active boolean NOT NULL DEFAULT true,
  target_audience text, -- 'all', 'pro', 'enterprise', or JSON array of tenant IDs
  start_date timestamptz,
  end_date timestamptz,
  action_url text,
  action_text text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);

-- ============================================================================
-- FEATURE FLAGS
-- ============================================================================
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage text DEFAULT '0',
  target_tenants jsonb, -- JSON array of tenant IDs, null = all tenants
  metadata jsonb, -- Additional config
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_is_enabled ON feature_flags(is_enabled);

-- ============================================================================
-- SYSTEM HEALTH
-- ============================================================================
CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE system_health (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  service text NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time integer,
  uptime integer,
  cpu_usage integer,
  memory_usage integer,
  active_connections integer,
  error_rate integer,
  last_checked timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_health_service ON system_health(service);
CREATE INDEX idx_system_health_status ON system_health(status);
CREATE INDEX idx_system_health_last_checked ON system_health(last_checked);

-- ============================================================================
-- ERROR LOGS
-- ============================================================================
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  service text NOT NULL,
  severity error_severity NOT NULL DEFAULT 'medium',
  error_type text,
  message text NOT NULL,
  stack_trace text,
  user_id uuid,
  tenant_id uuid,
  metadata text, -- JSON string
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_service ON error_logs(service);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_is_resolved ON error_logs(is_resolved);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);

-- ============================================================================
-- COMMISSION RATES
-- ============================================================================
CREATE TABLE commission_rates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  plan text NOT NULL UNIQUE CHECK (plan IN ('free', 'pro', 'enterprise')),
  rate decimal(5, 2) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default commission rates
INSERT INTO commission_rates (plan, rate, description) VALUES
  ('free', 0.00, 'Free plan - no commission'),
  ('pro', 15.00, 'Pro plan - 15% commission'),
  ('enterprise', 10.00, 'Enterprise plan - 10% commission')
ON CONFLICT (plan) DO NOTHING;

-- ============================================================================
-- WHITE-LABEL REQUESTS
-- ============================================================================
CREATE TYPE white_label_status AS ENUM ('pending', 'approved', 'rejected', 'revoked');

CREATE TABLE white_label_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  status white_label_status NOT NULL DEFAULT 'pending',
  custom_domain text,
  hide_branding boolean NOT NULL DEFAULT false,
  custom_app_name text,
  reason text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_white_label_requests_tenant_id ON white_label_requests(tenant_id);
CREATE INDEX idx_white_label_requests_status ON white_label_requests(status);
CREATE INDEX idx_white_label_requests_requested_by ON white_label_requests(requested_by);

