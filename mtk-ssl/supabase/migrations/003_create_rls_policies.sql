-- ============================================================================
-- Migration 003: Row Level Security (RLS) Policies
-- ============================================================================
-- This migration enables RLS on all tables and creates policies for
-- complete data isolation per tenant with super admin override.

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_innings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANTS POLICIES
-- ============================================================================
-- Super admin can do everything
CREATE POLICY "Super admin can manage all tenants"
  ON tenants FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Users can view tenants they belong to
CREATE POLICY "Users can view their tenants"
  ON tenants FOR SELECT
  USING (
    is_super_admin() OR
    id = ANY(current_tenant_id())
  );

-- Users can update tenants they own
CREATE POLICY "Users can update their owned tenants"
  ON tenants FOR UPDATE
  USING (
    is_super_admin() OR
    (id = ANY(current_tenant_id()) AND owner_id = current_user_id())
  )
  WITH CHECK (
    is_super_admin() OR
    (id = ANY(current_tenant_id()) AND owner_id = current_user_id())
  );

-- ============================================================================
-- TENANT BRANDING POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all branding"
  ON tenant_branding FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view branding of their tenants"
  ON tenant_branding FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can update branding of their tenants"
  ON tenant_branding FOR UPDATE
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can insert branding for their tenants"
  ON tenant_branding FOR INSERT
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- USERS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all users"
  ON users FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Users can view themselves
CREATE POLICY "Users can view themselves"
  ON users FOR SELECT
  USING (
    is_super_admin() OR
    email = (auth.jwt() ->> 'email')
  );

-- Users can update themselves
CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (
    is_super_admin() OR
    email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    is_super_admin() OR
    email = (auth.jwt() ->> 'email')
  );

-- Users can view other users in their tenants
CREATE POLICY "Users can view users in their tenants"
  ON users FOR SELECT
  USING (
    is_super_admin() OR
    tenant_ids && current_tenant_id() -- Array overlap check
  );

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all profiles"
  ON profiles FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view profiles in their tenants"
  ON profiles FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage their own profiles"
  ON profiles FOR ALL
  USING (
    is_super_admin() OR
    (tenant_id = ANY(current_tenant_id()) AND user_id = current_user_id())
  )
  WITH CHECK (
    is_super_admin() OR
    (tenant_id = ANY(current_tenant_id()) AND user_id = current_user_id())
  );

-- ============================================================================
-- TOURNAMENTS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all tournaments"
  ON tournaments FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view tournaments in their tenants"
  ON tournaments FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage tournaments in their tenants"
  ON tournaments FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- TEAMS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all teams"
  ON teams FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view teams in their tenants"
  ON teams FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage teams in their tenants"
  ON teams FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- PLAYERS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all players"
  ON players FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view players in their tenants"
  ON players FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage players in their tenants"
  ON players FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- MATCHES POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all matches"
  ON matches FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view matches in their tenants"
  ON matches FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage matches in their tenants"
  ON matches FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- MATCH INNINGS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all match innings"
  ON match_innings FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view match innings in their tenants"
  ON match_innings FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage match innings in their tenants"
  ON match_innings FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- MATCH BALLS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all match balls"
  ON match_balls FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view match balls in their tenants"
  ON match_balls FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage match balls in their tenants"
  ON match_balls FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- VENUES POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all venues"
  ON venues FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view venues in their tenants"
  ON venues FOR SELECT
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

CREATE POLICY "Users can manage venues in their tenants"
  ON venues FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- DOCUMENTS POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all documents"
  ON documents FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view public documents or documents in their tenants"
  ON documents FOR SELECT
  USING (
    is_super_admin() OR
    (is_public = true) OR
    (tenant_id = ANY(current_tenant_id()))
  );

CREATE POLICY "Users can manage documents in their tenants"
  ON documents FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

-- ============================================================================
-- MEDIA POLICIES
-- ============================================================================
CREATE POLICY "Super admin can manage all media"
  ON media FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view public media or media in their tenants"
  ON media FOR SELECT
  USING (
    is_super_admin() OR
    (is_public = true) OR
    (tenant_id = ANY(current_tenant_id()))
  );

CREATE POLICY "Users can manage media in their tenants"
  ON media FOR ALL
  USING (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  )
  WITH CHECK (
    is_super_admin() OR
    tenant_id = ANY(current_tenant_id())
  );

