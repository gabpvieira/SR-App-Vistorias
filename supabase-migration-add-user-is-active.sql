-- Migration: Adicionar campo is_active para desativação de usuários
-- Data: 2025-01-08
-- Descrição: Permite desativar usuários ao invés de deletá-los, preservando histórico de vistorias

-- Adicionar campo is_active na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Comentário explicativo
COMMENT ON COLUMN users.is_active IS 'Indica se o usuário está ativo no sistema. Usuários inativos não podem fazer login mas seu histórico é preservado.';

-- Atualizar todos os usuários existentes para ativo
UPDATE users SET is_active = true WHERE is_active IS NULL;
