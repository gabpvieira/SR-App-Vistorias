# Ajuste: Separação de Ano de Fabricação e Ano do Modelo

## Mudança Implementada

Separamos o campo de ano em dois campos distintos para seguir o padrão da indústria automotiva:

### Campos

1. **Ano de Fabricação** (`vehicle_year`)
   - Campo numérico de entrada livre
   - Intervalo: 2000 até ano atual
   - Representa o ano em que o veículo foi fabricado

2. **Ano do Modelo** (`vehicle_model_year`)
   - Campo select com apenas 2 opções
   - Opções: ano de fabricação OU ano de fabricação + 1
   - Exemplo: Se fabricação = 2024, modelo pode ser 2024 ou 2025
   - Representa o ano do modelo do veículo

### Lógica de Funcionamento

1. Usuário preenche o ano de fabricação (ex: 2024)
2. Campo de ano do modelo é habilitado automaticamente
3. Ao clicar no ano do modelo, aparecem apenas 2 opções:
   - 2024 (mesmo ano)
   - 2025 (ano seguinte)

### Alterações no Banco de Dados

**Migração aplicada:** `add_vehicle_model_year`

```sql
-- Adiciona campo para ano do modelo
ALTER TABLE inspections 
ADD COLUMN IF NOT EXISTS vehicle_model_year INTEGER;

-- Atualiza registros existentes
UPDATE inspections 
SET vehicle_model_year = vehicle_year 
WHERE vehicle_model_year IS NULL;

-- Adiciona constraint de validação
ALTER TABLE inspections 
ADD CONSTRAINT check_vehicle_model_year 
CHECK (vehicle_model_year >= 2000 AND vehicle_model_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1);
```

### Alterações no Código

**Arquivos modificados:**

1. `src/lib/supabase.ts`
   - Adicionado campo `vehicle_model_year?: number` na interface `Inspection`

2. `src/pages/NewInspection.tsx`
   - Separado em dois campos: `fabricationYear` e `modelYear`
   - Implementado Select com apenas 2 opções baseadas no ano de fabricação
   - Atualizado envio de dados para incluir ambos os campos

3. `src/pages/GuidedInspection.tsx`
   - Atualizado para receber e salvar ambos os campos via query params

4. `supabase-schema.sql`
   - Documentado o novo campo no schema

### Benefícios

- ✅ Segue o padrão da indústria automotiva (ano fabricação/modelo)
- ✅ Facilita o preenchimento com apenas 2 opções no ano do modelo
- ✅ Evita erros de digitação no ano do modelo
- ✅ Mantém compatibilidade com registros existentes
- ✅ Interface mais intuitiva e rápida

### Exemplo de Uso

```typescript
// Criando uma vistoria
addInspection({
  vehicle_year: 2024,        // Ano de fabricação
  vehicle_model_year: 2025,  // Ano do modelo
  // ... outros campos
});
```

### Retrocompatibilidade

- Registros antigos sem `vehicle_model_year` foram automaticamente preenchidos com o valor de `vehicle_year`
- O campo `vehicle_model_year` é opcional no TypeScript para manter compatibilidade
- A migração garante que todos os registros tenham um valor válido
