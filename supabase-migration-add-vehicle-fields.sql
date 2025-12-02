-- ============================================
-- MIGRATION: Add Vehicle Fields
-- Adiciona campos obrigatórios de modelo, ano e status
-- ============================================

-- Adicionar novos campos (temporariamente como nullable)
ALTER TABLE inspections 
  ADD COLUMN IF NOT EXISTS vehicle_model_name TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
  ADD COLUMN IF NOT EXISTS vehicle_status TEXT CHECK (vehicle_status IN ('novo', 'seminovo'));

-- Atualizar registros existentes com valores padrão
UPDATE inspections 
SET 
  vehicle_model_name = COALESCE(vehicle_model_name, 'NÃO INFORMADO'),
  vehicle_year = COALESCE(vehicle_year, 2020),
  vehicle_status = COALESCE(vehicle_status, 'seminovo')
WHERE vehicle_model_name IS NULL 
   OR vehicle_year IS NULL 
   OR vehicle_status IS NULL;

-- Tornar vehicle_plate obrigatório (se ainda não for)
ALTER TABLE inspections 
  ALTER COLUMN vehicle_plate SET NOT NULL;

-- Tornar os novos campos obrigatórios
ALTER TABLE inspections 
  ALTER COLUMN vehicle_model_name SET NOT NULL,
  ALTER COLUMN vehicle_year SET NOT NULL,
  ALTER COLUMN vehicle_status SET NOT NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_model_name ON inspections(vehicle_model_name);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_year ON inspections(vehicle_year);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_status ON inspections(vehicle_status);

-- Verificar resultado
SELECT 
  COUNT(*) as total_inspections,
  COUNT(vehicle_model_name) as with_model,
  COUNT(vehicle_year) as with_year,
  COUNT(vehicle_status) as with_status
FROM inspections;
