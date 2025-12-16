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
  vehicle_year INTEGER NOT NULL, -- Ano de fabricação
  vehicle_model_year INTEGER, -- Ano do modelo (pode ser igual ao ano de fabricação ou ano seguinte)
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


-- ============================================
-- INSPECTION ACTIVITIES TABLE
-- Permite adicionar novas atividades a uma vistoria existente
-- ============================================
CREATE TABLE IF NOT EXISTS inspection_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('livre', 'guiada')),
  vehicle_model TEXT CHECK (vehicle_model IN ('cavalo', 'rodotrem_basculante', 'rodotrem_graneleiro', 'livre')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_activities_inspection_id ON inspection_activities(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_activities_created_by ON inspection_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_inspection_activities_created_at ON inspection_activities(created_at DESC);

-- ============================================
-- INSPECTION ACTIVITY PHOTOS TABLE
-- Fotos vinculadas a atividades adicionais
-- ============================================
CREATE TABLE IF NOT EXISTS inspection_activity_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES inspection_activities(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_inspection_activity_photos_activity_id ON inspection_activity_photos(activity_id);
CREATE INDEX IF NOT EXISTS idx_inspection_activity_photos_step_order ON inspection_activity_photos(step_order);

-- ============================================
-- INSPECTION COMMENTS TABLE
-- Comentários colaborativos estilo Trello
-- ============================================
CREATE TABLE IF NOT EXISTS inspection_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_comments_inspection_id ON inspection_comments(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_comments_user_id ON inspection_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_inspection_comments_created_at ON inspection_comments(created_at DESC);

-- ============================================
-- TRIGGERS FOR NEW TABLES
-- ============================================

-- Trigger para updated_at em inspection_activities
DROP TRIGGER IF EXISTS update_inspection_activities_updated_at ON inspection_activities;
CREATE TRIGGER update_inspection_activities_updated_at
  BEFORE UPDATE ON inspection_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em inspection_comments
DROP TRIGGER IF EXISTS update_inspection_comments_updated_at ON inspection_comments;
CREATE TRIGGER update_inspection_comments_updated_at
  BEFORE UPDATE ON inspection_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

-- Enable RLS
ALTER TABLE inspection_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_activity_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_comments ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations (seguindo o padrão das outras tabelas)
CREATE POLICY "Allow all operations on inspection_activities" ON inspection_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on inspection_activity_photos" ON inspection_activity_photos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on inspection_comments" ON inspection_comments
  FOR ALL USING (true) WITH CHECK (true);


-- ============================================
-- COMMENT LIKES TABLE
-- Sistema de curtidas nos comentários
-- ============================================
CREATE TABLE IF NOT EXISTS inspection_comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES inspection_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON inspection_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON inspection_comment_likes(user_id);

-- RLS
ALTER TABLE inspection_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on inspection_comment_likes" ON inspection_comment_likes
  FOR ALL USING (true) WITH CHECK (true);


-- =====================================================
-- FEATURE FEEDBACK TABLE (Sistema de Feedback em Produção)
-- =====================================================
-- Permite que clientes avaliem etapas de vistoria sem afetar dados reais

CREATE TABLE IF NOT EXISTS feature_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identificação da funcionalidade/etapa
  feature_type TEXT NOT NULL CHECK (feature_type IN ('vistoria_etapa', 'funcionalidade_geral', 'interface', 'fluxo')),
  vistoria_tipo TEXT CHECK (vistoria_tipo IN ('cavalo', 'rodotrem_basculante', 'rodotrem_graneleiro', 'livre', 'troca', 'manutencao')),
  etapa_id TEXT,
  etapa_label TEXT,
  
  -- Status do feedback
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'rejected', 'hidden', 'pending')),
  
  -- Comentário opcional
  comentario TEXT,
  
  -- Ambiente onde foi criado
  ambiente TEXT NOT NULL DEFAULT 'production' CHECK (ambiente IN ('production', 'development')),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(user_id, feature_type, vistoria_tipo, etapa_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feature_feedback_user_id ON feature_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_vistoria_tipo ON feature_feedback(vistoria_tipo);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_status ON feature_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_ambiente ON feature_feedback(ambiente);
CREATE INDEX IF NOT EXISTS idx_feature_feedback_created_at ON feature_feedback(created_at DESC);

-- RLS
ALTER TABLE feature_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own feedback" ON feature_feedback
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own feedback" ON feature_feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own feedback" ON feature_feedback
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Managers can view all feedback" ON feature_feedback
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'gerente'
  ));
