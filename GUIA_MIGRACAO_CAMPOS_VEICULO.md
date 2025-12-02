# 🔄 Guia de Migração - Campos de Veículo

## 📋 Pré-requisitos
- Acesso ao Supabase Dashboard
- Backup do banco de dados (recomendado)

---

## 🚀 Passo a Passo

### 1. Fazer Backup (Recomendado)
```sql
-- No Supabase Dashboard > SQL Editor
-- Criar backup da tabela inspections
CREATE TABLE inspections_backup AS 
SELECT * FROM inspections;
```

### 2. Executar Migração

#### Opção A: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo de `supabase-migration-add-vehicle-fields.sql`
5. Clique em **Run** ou pressione `Ctrl+Enter`
6. ✅ Verifique se apareceu "Success"

#### Opção B: Via Supabase CLI
```bash
# Se estiver usando Supabase CLI local
supabase db push

# Ou aplicar migração específica
psql $DATABASE_URL -f supabase-migration-add-vehicle-fields.sql
```

### 3. Verificar Migração
```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'inspections'
  AND column_name IN ('vehicle_model_name', 'vehicle_year', 'vehicle_status')
ORDER BY ordinal_position;

-- Verificar dados
SELECT 
  id,
  vehicle_plate,
  vehicle_model_name,
  vehicle_year,
  vehicle_status
FROM inspections
LIMIT 5;
```

### 4. Verificar Constraints
```sql
-- Verificar constraints CHECK
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'inspections'
  AND con.contype = 'c';
```

### 5. Verificar Índices
```sql
-- Verificar índices criados
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'inspections'
  AND indexname LIKE '%vehicle%';
```

---

## ✅ Resultado Esperado

### Estrutura da Tabela
```
inspections
├── id (uuid, PK)
├── user_id (uuid, FK, NOT NULL)
├── type (text, NOT NULL)
├── vehicle_model (text)
├── vehicle_plate (text, NOT NULL) ← Agora obrigatório
├── vehicle_model_name (text, NOT NULL) ← NOVO
├── vehicle_year (integer, NOT NULL) ← NOVO
├── vehicle_status (text, NOT NULL) ← NOVO
├── is_guided_inspection (boolean)
├── guided_photos_complete (boolean)
├── status (text, NOT NULL)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── ... outros campos
```

### Constraints
```sql
✅ vehicle_status CHECK (vehicle_status IN ('novo', 'seminovo'))
✅ vehicle_plate NOT NULL
✅ vehicle_model_name NOT NULL
✅ vehicle_year NOT NULL
✅ vehicle_status NOT NULL
```

### Índices
```sql
✅ idx_inspections_vehicle_model_name
✅ idx_inspections_vehicle_year
✅ idx_inspections_vehicle_status
```

---

## 🐛 Troubleshooting

### Erro: "column already exists"
```sql
-- Verificar se coluna já existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'inspections' 
  AND column_name = 'vehicle_model_name';

-- Se já existe, pular para próximo passo
```

### Erro: "violates not-null constraint"
```sql
-- Verificar registros sem valor
SELECT id, vehicle_plate 
FROM inspections 
WHERE vehicle_model_name IS NULL 
   OR vehicle_year IS NULL 
   OR vehicle_status IS NULL;

-- Atualizar manualmente se necessário
UPDATE inspections 
SET 
  vehicle_model_name = 'NÃO INFORMADO',
  vehicle_year = 2020,
  vehicle_status = 'seminovo'
WHERE vehicle_model_name IS NULL;
```

### Erro: "violates check constraint"
```sql
-- Verificar valores inválidos
SELECT DISTINCT vehicle_status 
FROM inspections 
WHERE vehicle_status NOT IN ('novo', 'seminovo');

-- Corrigir valores inválidos
UPDATE inspections 
SET vehicle_status = 'seminovo' 
WHERE vehicle_status NOT IN ('novo', 'seminovo');
```

---

## 🔙 Rollback (Se Necessário)

### Reverter Migração
```sql
-- Remover constraints
ALTER TABLE inspections 
  ALTER COLUMN vehicle_model_name DROP NOT NULL,
  ALTER COLUMN vehicle_year DROP NOT NULL,
  ALTER COLUMN vehicle_status DROP NOT NULL,
  ALTER COLUMN vehicle_plate DROP NOT NULL;

-- Remover índices
DROP INDEX IF EXISTS idx_inspections_vehicle_model_name;
DROP INDEX IF EXISTS idx_inspections_vehicle_year;
DROP INDEX IF EXISTS idx_inspections_vehicle_status;

-- Remover colunas (CUIDADO: perda de dados!)
ALTER TABLE inspections 
  DROP COLUMN IF EXISTS vehicle_model_name,
  DROP COLUMN IF EXISTS vehicle_year,
  DROP COLUMN IF EXISTS vehicle_status;

-- Restaurar backup se necessário
-- DROP TABLE inspections;
-- ALTER TABLE inspections_backup RENAME TO inspections;
```

---

## 📊 Validação Final

### Checklist de Validação
```sql
-- 1. Verificar que todos os campos existem
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'inspections' 
  AND column_name IN ('vehicle_model_name', 'vehicle_year', 'vehicle_status');
-- Resultado esperado: 3

-- 2. Verificar que são NOT NULL
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'inspections' 
  AND column_name IN ('vehicle_model_name', 'vehicle_year', 'vehicle_status')
  AND is_nullable = 'NO';
-- Resultado esperado: 3

-- 3. Verificar constraint CHECK
SELECT COUNT(*) 
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'inspections'
  AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) LIKE '%vehicle_status%';
-- Resultado esperado: >= 1

-- 4. Verificar índices
SELECT COUNT(*) 
FROM pg_indexes 
WHERE tablename = 'inspections' 
  AND indexname LIKE '%vehicle%';
-- Resultado esperado: >= 3

-- 5. Verificar dados
SELECT 
  COUNT(*) as total,
  COUNT(vehicle_model_name) as with_model,
  COUNT(vehicle_year) as with_year,
  COUNT(vehicle_status) as with_status
FROM inspections;
-- Todos os valores devem ser iguais
```

---

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. ✅ Testar criação de nova vistoria no frontend
2. ✅ Verificar que campos aparecem em maiúsculas
3. ✅ Testar validações de formulário
4. ✅ Verificar exibição nos cards e detalhes
5. ✅ Testar vistoria guiada com novos campos
6. ✅ Verificar que registros antigos têm valores padrão

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do Supabase
2. Consulte a documentação: `FUNCIONALIDADE_CAMPOS_VEICULO.md`
3. Revise o schema: `supabase-schema.sql`
4. Execute queries de diagnóstico acima
