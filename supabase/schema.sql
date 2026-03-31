-- VidSyncro Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  image TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- PROJECTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  video_a JSONB,
  video_b JSONB,
  overlay_config JSONB NOT NULL DEFAULT '{
    "switchMode": "hold",
    "transitionType": "crossfade",
    "transitionDuration": 400,
    "showHint": true,
    "hintText": "Hold to reveal",
    "hintPosition": "bottom-center",
    "showSwitchIndicator": true,
    "indicatorColor": "#8b5cf6",
    "brandingVisible": false,
    "brandingText": "VidSyncro",
    "brandingUrl": "https://vidsyncro.com",
    "autoSwitchEnabled": false,
    "autoSwitchInterval": 5000
  }'::jsonb,
  embed_config JSONB NOT NULL DEFAULT '{
    "width": "100%",
    "height": "100%",
    "responsive": true,
    "autoplay": false,
    "muted": false,
    "loop": false,
    "allowFullscreen": true,
    "shareEnabled": true,
    "passwordProtected": false,
    "password": null,
    "domainWhitelist": [],
    "primaryColor": "#8b5cf6",
    "backgroundColor": "#000000"
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  total_views INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ANALYTICS EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project_id_created_at ON analytics_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

-- ==========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INCREMENT PROJECT VIEWS FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION increment_project_views(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET total_views = total_views + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- INCREMENT PROJECT INTERACTIONS FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION increment_project_interactions(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects
  SET total_interactions = total_interactions + 1
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES RLS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- PROJECTS RLS POLICIES
-- ==========================================

-- Users can SELECT their own projects
DROP POLICY IF EXISTS "projects_select_own" ON projects;
CREATE POLICY "projects_select_own" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can SELECT published projects (for embed)
DROP POLICY IF EXISTS "projects_select_published" ON projects;
CREATE POLICY "projects_select_published" ON projects
  FOR SELECT USING (status = 'published');

-- Users can INSERT their own projects
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own projects
DROP POLICY IF EXISTS "projects_update_own" ON projects;
CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can DELETE their own projects
DROP POLICY IF EXISTS "projects_delete_own" ON projects;
CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- ANALYTICS EVENTS RLS POLICIES
-- ==========================================

-- Anyone can INSERT analytics events (for embed tracking)
DROP POLICY IF EXISTS "analytics_events_insert_all" ON analytics_events;
CREATE POLICY "analytics_events_insert_all" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Only project owner can SELECT their analytics
DROP POLICY IF EXISTS "analytics_events_select_own" ON analytics_events;
CREATE POLICY "analytics_events_select_own" ON analytics_events
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ==========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, image)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ==========================================
-- STRIPE COLUMNS (add after initial deploy)
-- ==========================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE INDEX IF NOT EXISTS profiles_stripe_customer_idx ON profiles(stripe_customer_id);
