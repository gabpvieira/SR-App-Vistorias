# Funcionalidade de Desativação de Usuários

## Visão Geral

Implementado sistema de desativação de usuários ao invés de exclusão definitiva, preservando todo o histórico de vistorias realizadas pelos colaboradores.

## Motivação

Quando um colaborador é desligado da empresa, é importante:
- ✅ Impedir que ele acesse o sistema
- ✅ Preservar todo o histórico de vistorias realizadas
- ✅ Manter a integridade dos dados
- ✅ Permitir reativação caso o colaborador retorne

## Implementação Técnica

### 1. Banco de Dados

**Campo adicionado na tabela `users`:**
```sql
is_active BOOLEAN NOT NULL DEFAULT true
```

**Índice criado:**
```sql
CREATE INDEX idx_users_is_active ON users(is_active);
```

### 2. Arquivos Modificados

#### `src/lib/supabase.ts`
- Adicionado campo `is_active: boolean` na interface `User`

#### `src/lib/supabase-queries.ts`
- **`authenticateUser()`**: Verifica se usuário está ativo antes de permitir login
- **`createUser()`**: Novos usuários são criados com `is_active: true`
- **`deactivateUser(userId)`**: Nova função para desativar usuário
- **`activateUser(userId)`**: Nova função para reativar usuário

#### `src/contexts/AuthContext.tsx`
- Atualizado para incluir `is_active` no objeto User
- Mensagem de erro específica quando conta está desativada

#### `src/pages/UserManagement.tsx`
- Substituído botão "Deletar" por "Desativar/Reativar"
- Adicionada coluna "Status" mostrando se usuário está ativo/inativo
- Badges visuais (verde para ativo, vermelho para inativo)
- Ícones: `UserCheck` (ativo) e `UserX` (inativo)

## Comportamento do Sistema

### Login
- ✅ Usuários ativos: Login normal
- ❌ Usuários inativos: Mensagem "Sua conta foi desativada. Entre em contato com o administrador."

### Gerenciamento de Usuários (Gerentes)

**Desativar Usuário:**
1. Clicar no ícone ❌ (UserX) ao lado do usuário ativo
2. Confirmar ação no diálogo
3. Usuário é marcado como inativo
4. Histórico de vistorias é preservado
5. Usuário não pode mais fazer login

**Reativar Usuário:**
1. Clicar no ícone ✓ (UserCheck) ao lado do usuário inativo
2. Confirmar ação no diálogo
3. Usuário é marcado como ativo
4. Usuário pode fazer login novamente

### Proteções
- ❌ Gerente não pode desativar sua própria conta
- ✅ Histórico de vistorias permanece intacto
- ✅ Comentários e atividades do usuário são preservados
- ✅ Relacionamentos no banco de dados mantidos

## Interface Visual

### Desktop
- Tabela com coluna "Status"
- Badge colorido indicando status (Verde/Vermelho)
- Botão com ícone para alternar status
- Diálogo de confirmação com descrição clara

### Mobile
- Cards compactos
- Badge de status abaixo do email
- Botão de ação no canto direito
- Diálogo responsivo

## Mensagens ao Usuário

### Desativação
```
Título: Usuário desativado
Descrição: [Nome] foi desativado. O histórico de vistorias foi preservado.
```

### Reativação
```
Título: Usuário reativado
Descrição: [Nome] foi reativado e pode acessar o sistema novamente.
```

### Login Bloqueado
```
Sua conta foi desativada. Entre em contato com o administrador.
```

## Vantagens

1. **Preservação de Dados**
   - Todo histórico de vistorias mantido
   - Rastreabilidade completa
   - Auditoria preservada

2. **Flexibilidade**
   - Reativação simples se colaborador retornar
   - Sem perda de dados históricos
   - Processo reversível

3. **Segurança**
   - Acesso bloqueado imediatamente
   - Verificação no login
   - Proteção contra auto-desativação

4. **Experiência do Usuário**
   - Interface clara e intuitiva
   - Feedback visual imediato
   - Confirmações antes de ações críticas

## Migração Aplicada

```sql
-- Arquivo: supabase-migration-add-user-is-active.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
COMMENT ON COLUMN users.is_active IS 'Indica se o usuário está ativo no sistema.';
UPDATE users SET is_active = true WHERE is_active IS NULL;
```

## Testando

1. **Desativar usuário:**
   - Login como gerente
   - Ir para "Gerenciar Usuários"
   - Clicar no ícone ❌ de um usuário ativo
   - Confirmar desativação
   - Verificar que status mudou para "Inativo"

2. **Tentar login com usuário desativado:**
   - Fazer logout
   - Tentar login com usuário desativado
   - Verificar mensagem de erro apropriada

3. **Reativar usuário:**
   - Login como gerente
   - Clicar no ícone ✓ do usuário inativo
   - Confirmar reativação
   - Verificar que usuário pode fazer login novamente

4. **Verificar histórico:**
   - Confirmar que vistorias do usuário desativado ainda aparecem
   - Verificar que nome do usuário aparece corretamente nas vistorias

## Notas Importantes

- ⚠️ Usuários desativados NÃO são deletados do banco
- ✅ Todas as vistorias permanecem visíveis e consultáveis
- ✅ Processo é completamente reversível
- ✅ Não há perda de dados em nenhum momento
