-- ============================================
-- SUPABASE SEED DATA
-- Dados iniciais para o sistema
-- ============================================

-- ============================================
-- SEED USERS
-- ============================================
INSERT INTO users (email, name, role) VALUES
  ('vendedor1@example.com', 'João Silva', 'vendedor'),
  ('vendedor2@example.com', 'Maria Santos', 'vendedor'),
  ('gerente1@example.com', 'Carlos Oliveira', 'gerente'),
  ('gerente2@example.com', 'Ana Costa', 'gerente')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SEED INSPECTION STEPS TEMPLATE - CAVALO
-- ============================================
INSERT INTO inspection_steps_template (vehicle_model, label, instruction, step_order, is_required) VALUES
  ('cavalo', 'Frente do Veículo', 'Tire uma foto da frente completa do cavalo mecânico', 1, true),
  ('cavalo', 'Lateral Esquerda', 'Tire uma foto da lateral esquerda completa', 2, true),
  ('cavalo', 'Lateral Direita', 'Tire uma foto da lateral direita completa', 3, true),
  ('cavalo', 'Traseira', 'Tire uma foto da traseira do veículo', 4, true),
  ('cavalo', 'Painel de Instrumentos', 'Tire uma foto do painel mostrando o hodômetro', 5, true),
  ('cavalo', 'Motor', 'Tire uma foto do motor', 6, true),
  ('cavalo', 'Chassi', 'Tire uma foto da placa do chassi', 7, true),
  ('cavalo', 'Pneus Dianteiros', 'Tire fotos dos pneus dianteiros', 8, true),
  ('cavalo', 'Pneus Traseiros', 'Tire fotos dos pneus traseiros', 9, true),
  ('cavalo', 'Interior Cabine', 'Tire uma foto do interior da cabine', 10, true)
ON CONFLICT (vehicle_model, step_order) DO NOTHING;

-- ============================================
-- SEED INSPECTION STEPS TEMPLATE - RODOTREM BASCULANTE
-- ============================================
INSERT INTO inspection_steps_template (vehicle_model, label, instruction, step_order, is_required) VALUES
  ('rodotrem_basculante', 'Frente do Conjunto', 'Tire uma foto da frente completa do rodotrem', 1, true),
  ('rodotrem_basculante', 'Lateral Esquerda Completa', 'Tire uma foto da lateral esquerda do conjunto completo', 2, true),
  ('rodotrem_basculante', 'Lateral Direita Completa', 'Tire uma foto da lateral direita do conjunto completo', 3, true),
  ('rodotrem_basculante', 'Traseira', 'Tire uma foto da traseira do último reboque', 4, true),
  ('rodotrem_basculante', 'Sistema Basculante 1', 'Tire uma foto do sistema basculante do primeiro reboque', 5, true),
  ('rodotrem_basculante', 'Sistema Basculante 2', 'Tire uma foto do sistema basculante do segundo reboque', 6, true),
  ('rodotrem_basculante', 'Chassi Reboque 1', 'Tire uma foto da placa do chassi do primeiro reboque', 7, true),
  ('rodotrem_basculante', 'Chassi Reboque 2', 'Tire uma foto da placa do chassi do segundo reboque', 8, true),
  ('rodotrem_basculante', 'Pneus Reboque 1', 'Tire fotos dos pneus do primeiro reboque', 9, true),
  ('rodotrem_basculante', 'Pneus Reboque 2', 'Tire fotos dos pneus do segundo reboque', 10, true),
  ('rodotrem_basculante', 'Sistema de Freios', 'Tire uma foto do sistema de freios', 11, true),
  ('rodotrem_basculante', 'Engate/Quinta Roda', 'Tire uma foto do sistema de engate', 12, true)
ON CONFLICT (vehicle_model, step_order) DO NOTHING;

-- ============================================
-- SEED INSPECTION STEPS TEMPLATE - RODOTREM GRANELEIRO
-- ============================================
INSERT INTO inspection_steps_template (vehicle_model, label, instruction, step_order, is_required) VALUES
  ('rodotrem_graneleiro', 'Frente do Conjunto', 'Tire uma foto da frente completa do rodotrem', 1, true),
  ('rodotrem_graneleiro', 'Lateral Esquerda Completa', 'Tire uma foto da lateral esquerda do conjunto completo', 2, true),
  ('rodotrem_graneleiro', 'Lateral Direita Completa', 'Tire uma foto da lateral direita do conjunto completo', 3, true),
  ('rodotrem_graneleiro', 'Traseira', 'Tire uma foto da traseira do último reboque', 4, true),
  ('rodotrem_graneleiro', 'Interior Caçamba 1', 'Tire uma foto do interior da primeira caçamba', 5, true),
  ('rodotrem_graneleiro', 'Interior Caçamba 2', 'Tire uma foto do interior da segunda caçamba', 6, true),
  ('rodotrem_graneleiro', 'Portas Traseiras 1', 'Tire uma foto das portas traseiras do primeiro reboque', 7, true),
  ('rodotrem_graneleiro', 'Portas Traseiras 2', 'Tire uma foto das portas traseiras do segundo reboque', 8, true),
  ('rodotrem_graneleiro', 'Chassi Reboque 1', 'Tire uma foto da placa do chassi do primeiro reboque', 9, true),
  ('rodotrem_graneleiro', 'Chassi Reboque 2', 'Tire uma foto da placa do chassi do segundo reboque', 10, true),
  ('rodotrem_graneleiro', 'Pneus Reboque 1', 'Tire fotos dos pneus do primeiro reboque', 11, true),
  ('rodotrem_graneleiro', 'Pneus Reboque 2', 'Tire fotos dos pneus do segundo reboque', 12, true),
  ('rodotrem_graneleiro', 'Sistema de Freios', 'Tire uma foto do sistema de freios', 13, true),
  ('rodotrem_graneleiro', 'Engate/Quinta Roda', 'Tire uma foto do sistema de engate', 14, true)
ON CONFLICT (vehicle_model, step_order) DO NOTHING;
