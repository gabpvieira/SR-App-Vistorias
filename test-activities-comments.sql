-- ============================================
-- SCRIPT DE TESTE: Atividades e Comentários
-- ============================================

-- Este script adiciona dados de exemplo para testar
-- a funcionalidade de atividades e comentários

-- Pré-requisito: Ter pelo menos uma vistoria e um usuário no banco

-- ============================================
-- 1. Criar uma atividade de vistoria livre
-- ============================================
-- Substitua os UUIDs pelos IDs reais do seu banco
/*
INSERT INTO inspection_activities (
  inspection_id,
  type,
  vehicle_model,
  created_by
) VALUES (
  'SEU_INSPECTION_ID_AQUI',  -- ID de uma vistoria existente
  'livre',
  'livre',
  'SEU_USER_ID_AQUI'         -- ID do usuário que criou
);
*/

-- ============================================
-- 2. Criar uma atividade de vistoria guiada
-- ============================================
/*
INSERT INTO inspection_activities (
  inspection_id,
  type,
  vehicle_model,
  created_by
) VALUES (
  'SEU_INSPECTION_ID_AQUI',  -- ID de uma vistoria existente
  'guiada',
  'cavalo',
  'SEU_USER_ID_AQUI'         -- ID do usuário que criou
);
*/

-- ============================================
-- 3. Adicionar comentários de teste
-- ============================================
/*
INSERT INTO inspection_comments (
  inspection_id,
  user_id,
  content
) VALUES 
(
  'SEU_INSPECTION_ID_AQUI',
  'SEU_USER_ID_AQUI',
  'Primeira verificação realizada. Veículo em bom estado geral.'
),
(
  'SEU_INSPECTION_ID_AQUI',
  'SEU_USER_ID_AQUI',
  'Identificado pequeno arranhão no para-choque dianteiro. Documentado nas fotos.'
),
(
  'SEU_INSPECTION_ID_AQUI',
  'SEU_USER_ID_AQUI',
  'Cliente solicitou vistoria adicional do sistema elétrico. Atividade criada.'
);
*/

-- ============================================
-- 4. Consultas úteis para verificação
-- ============================================

-- Listar todas as atividades de uma vistoria
/*
SELECT 
  ia.*,
  u.name as created_by_name,
  (SELECT COUNT(*) FROM inspection_activity_photos WHERE activity_id = ia.id) as photo_count
FROM inspection_activities ia
JOIN users u ON ia.created_by = u.id
WHERE ia.inspection_id = 'SEU_INSPECTION_ID_AQUI'
ORDER BY ia.created_at DESC;
*/

-- Listar todos os comentários de uma vistoria
/*
SELECT 
  ic.*,
  u.name as user_name,
  u.role as user_role
FROM inspection_comments ic
JOIN users u ON ic.user_id = u.id
WHERE ic.inspection_id = 'SEU_INSPECTION_ID_AQUI'
ORDER BY ic.created_at ASC;
*/

-- Verificar estrutura das tabelas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('inspection_activities', 'inspection_activity_photos', 'inspection_comments')
ORDER BY table_name, ordinal_position;
