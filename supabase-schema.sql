-- ============================================
-- SUPABASE DATABASE SCHEMA
-- Sistema de Vistoria de Veículos
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('vendedor', 'gerente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- INSPECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('troca', 'manutencao')),
  vehicle_model TEXT CHECK (vehicle_model IN ('cavalo', 'rodotrem_basculante', 'rodotrem_graneleiro', 'livre')),
  is_guided_inspection BOOLEAN DEFAULT FALSE,
  guided_photos_complete BOOLEAN DEFAULT FALSE,
  vehicle_plate TEXT NOT NULL,
  vehicle_brand TEXT,
  vehicle_model_name TEXT NOT NULL,
  vehicle_year INTEGER NOT NULL,
  vehicle_status TEXT NOT NULL CHECK (vehicle_status IN ('novo', 'seminovo')),
  odometer INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'concluida', 'aprovada', 'rejeitada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON inspections(type);

-- ============================================
-- INSPECTION PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  step_order INTEGER,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  exif_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_id ON inspection_photos(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_step_order ON inspection_photos(step_order);

-- ============================================
-- INSPECTION STEPS TEMPLATE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inspection_steps_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_model TEXT NOT NULL CHECK (vehicle_model IN ('cavalo', 'rodotrem_basculante', 'rodotrem_graneleiro')),
  label TEXT NOT NULL,
  instruction TEXT NOT NULL,
  illustration_url TEXT,
  step_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_model, step_order)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_steps_template_vehicle_model ON inspection_steps_template(vehicle_model, step_order);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to inspections table
DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_steps_template ENABLE ROW LEVEL SECURITY;

-- Users: Allow all operations (since we're not using Supabase Auth)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Inspections: Allow all operations
CREATE POLICY "Allow all operations on inspections" ON inspections
  FOR ALL USING (true) WITH CHECK (true);

-- Inspection Photos: Allow all operations
CREATE POLICY "Allow all operations on inspection_photos" ON inspection_photos
  FOR ALL USING (true) WITH CHECK (true);

-- Inspection Steps Template: Allow read for all, insert/update/delete for all
CREATE POLICY "Allow all operations on inspection_steps_template" ON inspection_steps_template
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create storage bucket for inspection photos
-- Run this in Supabase Dashboard > Storage or via SQL:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('inspection-photos', 'inspection-photos', true);

-- Storage policies (allow all operations)
-- CREATE POLICY "Allow all operations on inspection-photos" ON storage.objects
--   FOR ALL USING (bucket_id = 'inspection-photos') WITH CHECK (bucket_id = 'inspection-photos');
