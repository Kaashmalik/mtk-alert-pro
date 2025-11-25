-- ============================================================================
-- Migration 002: Create All Tables
-- ============================================================================
-- This migration creates all tables for the multi-tenant SSL platform
-- with proper foreign keys and indexes.

-- ============================================================================
-- TENANTS (Leagues)
-- ============================================================================
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  custom_domain text UNIQUE,
  owner_id uuid NOT NULL, -- References auth.users
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);

-- ============================================================================
-- TENANT BRANDING (White-label configuration)
-- ============================================================================
CREATE TABLE tenant_branding (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url text,
  favicon_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_family text,
  app_name text, -- Custom app name for white-label
  hide_ssl_branding boolean NOT NULL DEFAULT false,
  custom_css text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- USERS (Multi-tenant users with tenant_id array)
-- ============================================================================
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  email text NOT NULL UNIQUE,
  tenant_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[], -- Array of tenant IDs user belongs to
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_ids ON users USING GIN(tenant_ids);

-- ============================================================================
-- PROFILES (Public user information)
-- ============================================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  bio text,
  date_of_birth date,
  nationality text,
  city text,
  state text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id) -- One profile per user per tenant
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX idx_profiles_display_name ON profiles(display_name);

-- ============================================================================
-- TOURNAMENTS
-- ============================================================================
CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  format text NOT NULL CHECK (format IN ('knockout', 'league', 'hybrid', 'round_robin')),
  start_date date,
  end_date date,
  registration_open boolean NOT NULL DEFAULT false,
  registration_deadline date,
  max_teams integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'registration', 'live', 'completed', 'cancelled')),
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_tournaments_tenant_id ON tournaments(tenant_id);
CREATE INDEX idx_tournaments_slug ON tournaments(tenant_id, slug);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);

-- ============================================================================
-- TEAMS
-- ============================================================================
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  logo_url text,
  captain_id uuid REFERENCES users(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES users(id) ON DELETE SET NULL,
  jersey_color text,
  home_ground text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_teams_tenant_id ON teams(tenant_id);
CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX idx_teams_slug ON teams(tenant_id, slug);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);

-- ============================================================================
-- PLAYERS
-- ============================================================================
CREATE TABLE players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, -- Optional link to user account
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  jersey_number integer,
  role text CHECK (role IN ('batsman', 'bowler', 'all_rounder', 'wicket_keeper', 'wicket_keeper_batsman')),
  batting_style text CHECK (batting_style IN ('right', 'left')),
  bowling_style text CHECK (bowling_style IN ('right_arm_fast', 'right_arm_medium', 'right_arm_spin', 'left_arm_fast', 'left_arm_medium', 'left_arm_spin')),
  is_active boolean NOT NULL DEFAULT true,
  joined_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_tenant_id ON players(tenant_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_profile_id ON players(profile_id);

-- ============================================================================
-- VENUES
-- ============================================================================
CREATE TABLE venues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  state text,
  country text,
  capacity integer,
  ground_type text CHECK (ground_type IN ('grass', 'synthetic', 'concrete', 'matting')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_venues_tenant_id ON venues(tenant_id);
CREATE INDEX idx_venues_name ON venues(tenant_id, name);

-- ============================================================================
-- MATCHES
-- ============================================================================
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  team_a_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  venue_id uuid REFERENCES venues(id) ON DELETE SET NULL,
  match_number integer,
  match_type text NOT NULL CHECK (match_type IN ('group', 'knockout', 'final', 'semi_final', 'quarter_final')),
  scheduled_date timestamptz,
  start_date timestamptz,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'abandoned', 'cancelled')),
  toss_winner_id uuid REFERENCES teams(id),
  toss_decision text CHECK (toss_decision IN ('bat', 'bowl')),
  winner_id uuid REFERENCES teams(id),
  result text, -- e.g., "Team A won by 5 wickets"
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (team_a_id != team_b_id)
);

CREATE INDEX idx_matches_tenant_id ON matches(tenant_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_team_a_id ON matches(team_a_id);
CREATE INDEX idx_matches_team_b_id ON matches(team_b_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_scheduled_date ON matches(scheduled_date);

-- ============================================================================
-- MATCH INNINGS
-- ============================================================================
CREATE TABLE match_innings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  innings_number integer NOT NULL CHECK (innings_number IN (1, 2)),
  total_runs integer NOT NULL DEFAULT 0,
  total_wickets integer NOT NULL DEFAULT 0,
  total_balls integer NOT NULL DEFAULT 0,
  extras integer NOT NULL DEFAULT 0,
  byes integer NOT NULL DEFAULT 0,
  leg_byes integer NOT NULL DEFAULT 0,
  wides integer NOT NULL DEFAULT 0,
  no_balls integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, innings_number)
);

CREATE INDEX idx_match_innings_tenant_id ON match_innings(tenant_id);
CREATE INDEX idx_match_innings_match_id ON match_innings(match_id);
CREATE INDEX idx_match_innings_team_id ON match_innings(team_id);

-- ============================================================================
-- MATCH BALLS (Ball-by-ball data)
-- ============================================================================
CREATE TABLE match_balls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  innings_id uuid NOT NULL REFERENCES match_innings(id) ON DELETE CASCADE,
  over_number integer NOT NULL,
  ball_number integer NOT NULL CHECK (ball_number BETWEEN 1 AND 6),
  bowler_id uuid REFERENCES players(id) ON DELETE SET NULL,
  batsman_id uuid REFERENCES players(id) ON DELETE SET NULL,
  runs integer NOT NULL DEFAULT 0,
  is_wicket boolean NOT NULL DEFAULT false,
  wicket_type text CHECK (wicket_type IN ('bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket', 'retired', 'retired_hurt')),
  is_four boolean NOT NULL DEFAULT false,
  is_six boolean NOT NULL DEFAULT false,
  is_wide boolean NOT NULL DEFAULT false,
  is_no_ball boolean NOT NULL DEFAULT false,
  is_bye boolean NOT NULL DEFAULT false,
  is_leg_bye boolean NOT NULL DEFAULT false,
  shot_direction text, -- For wagon wheel
  shot_type text, -- e.g., 'drive', 'cut', 'pull'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, innings_id, over_number, ball_number)
);

CREATE INDEX idx_match_balls_tenant_id ON match_balls(tenant_id);
CREATE INDEX idx_match_balls_match_id ON match_balls(match_id);
CREATE INDEX idx_match_balls_innings_id ON match_balls(innings_id);
CREATE INDEX idx_match_balls_bowler_id ON match_balls(bowler_id);
CREATE INDEX idx_match_balls_batsman_id ON match_balls(batsman_id);
CREATE INDEX idx_match_balls_over ON match_balls(match_id, innings_id, over_number, ball_number);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  category text, -- e.g., 'rules', 'registration_form', 'fixture', 'result'
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

-- ============================================================================
-- MEDIA
-- ============================================================================
CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL, -- 'image', 'video', 'audio'
  mime_type text,
  file_size bigint,
  width integer,
  height integer,
  duration integer, -- For video/audio in seconds
  thumbnail_url text,
  category text, -- e.g., 'highlight', 'photo', 'video', 'logo'
  related_match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  related_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  related_player_id uuid REFERENCES players(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_tenant_id ON media(tenant_id);
CREATE INDEX idx_media_file_type ON media(file_type);
CREATE INDEX idx_media_category ON media(category);
CREATE INDEX idx_media_related_match_id ON media(related_match_id);
CREATE INDEX idx_media_related_team_id ON media(related_team_id);
CREATE INDEX idx_media_related_player_id ON media(related_player_id);
CREATE INDEX idx_media_uploaded_by ON media(uploaded_by);

-- ============================================================================
-- TRIGGERS: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_branding_updated_at BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_innings_updated_at BEFORE UPDATE ON match_innings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

