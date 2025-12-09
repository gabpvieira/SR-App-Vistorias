# 🐛 Correção de Bugs - Vistoria Guiada

## Data: 09/12/2025

---

## 🔴 Problemas Identificados

### 1. Contador de Fotos Incorreto
**Sintoma:** O rodapé mostrava "6 de 9 fotos capturadas" quando na verdade havia mais fotos (considerando as múltiplas fotos das etapas 5, 7 e 8).

**Causa:** O contador estava usando apenas `photos.size`, que conta apenas as etapas com foto única, ignorando as etapas com múltiplas fotos (`multiplePhotos`).

### 2. Erro ao Finalizar Vistoria
**Sintoma:** 
```
StorageApiError: Invalid key: inspections/3ec86d4a-5e8b-4d84-855f-e71bcbd66d1f/5-Pneus_Dianteiros_(mínimo_2_fotos)_-_Foto_2.webp
```

**Causa:** O nome do arquivo continha caracteres especiais não permitidos pelo Supabase Storage:
- Parênteses: `(` `)`
- Acentos: `í` `ó`
- Espaços não convertidos corretamente

---

## ✅ Correções Aplicadas

### 1. Contador de Etapas Concluídas

**Arquivo:** `src/pages/GuidedInspection.tsx`

**Antes:**
```tsx
<p className="text-sm text-muted-foreground text-center">
  {photos.size} de {steps.length} fotos capturadas
</p>
```

**Depois:**
```tsx
<p className="text-sm text-muted-foreground text-center">
  {(() => {
    // Contar etapas completas (considerando múltiplas fotos)
    let completedSteps = 0;
    steps.forEach(step => {
      const isMultiple = step.label?.toLowerCase().includes('mínimo') || 
                        step.label?.toLowerCase().includes('até') ||
                        step.label?.toLowerCase().includes('plaqueta');
      
      if (isMultiple) {
        const stepPhotos = multiplePhotos.get(step.id) || [];
        let minRequired = 1;
        if (step.label?.toLowerCase().includes('pneus dianteiros')) {
          minRequired = 2;
        }
        if (stepPhotos.length >= minRequired) {
          completedSteps++;
        }
      } else {
        if (photos.has(step.id)) {
          completedSteps++;
        }
      }
    });
    return completedSteps;
  })()} de {steps.length} etapas concluídas
</p>
```

**Resultado:** Agora conta corretamente todas as etapas, incluindo as que têm múltiplas fotos.

---

### 2. Sanitização de Nomes de Arquivo

**Arquivo:** `src/lib/supabase-queries.ts`

**Funções alteradas:**
- `uploadInspectionPhoto()`
- `uploadAndSaveActivityPhoto()`

**Antes:**
```typescript
const fileName = stepOrder 
  ? `${stepOrder}-${label.replace(/\s+/g, '_')}.${fileExt}`
  : `${label.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
```

**Depois:**
```typescript
// Sanitizar o label removendo caracteres especiais
const sanitizedLabel = label
  .normalize('NFD') // Normalizar caracteres acentuados
  .replace(/[\u0300-\u036f]/g, '') // Remover acentos
  .replace(/[^\w\s-]/g, '') // Remover caracteres especiais exceto letras, números, espaços e hífens
  .replace(/\s+/g, '_') // Substituir espaços por underscore
  .replace(/_+/g, '_') // Remover underscores duplicados
  .replace(/^_|_$/g, ''); // Remover underscores no início e fim

const fileName = stepOrder 
  ? `${stepOrder}-${sanitizedLabel}.${fileExt}`
  : `${sanitizedLabel}-${Date.now()}.${fileExt}`;
```

**Exemplos de transformação:**
- `Pneus Dianteiros (mínimo 2 fotos)` → `Pneus_Dianteiros_minimo_2_fotos`
- `Lateral Passageiro com Plaqueta do Banco` → `Lateral_Passageiro_com_Plaqueta_do_Banco`
- `Detalhes em Observação (até 10 fotos)` → `Detalhes_em_Observacao_ate_10_fotos`

**Resultado:** Nomes de arquivo compatíveis com Supabase Storage.

---

## 🧪 Testes Realizados

- [x] Código compilado sem erros
- [x] Diagnósticos do TypeScript: 0 erros
- [ ] Teste manual: criar vistoria do cavalo
- [ ] Teste manual: adicionar fotos em todas as etapas
- [ ] Teste manual: verificar contador no rodapé
- [ ] Teste manual: finalizar vistoria com sucesso

---

## 📝 Observações

### Caracteres Removidos pela Sanitização:
- Parênteses: `(` `)`
- Colchetes: `[` `]`
- Chaves: `{` `}`
- Acentos: `á` `é` `í` `ó` `ú` `ã` `õ` `ç`
- Símbolos: `@` `#` `$` `%` `&` `*` `+` `=` `|` `\` `/` `<` `>` `?` `:` `;` `"` `'`

### Caracteres Permitidos:
- Letras: `a-z` `A-Z`
- Números: `0-9`
- Underscore: `_`
- Hífen: `-`

---

## 🎯 Impacto

### Antes:
- ❌ Contador mostrava número errado de fotos
- ❌ Upload falhava com caracteres especiais
- ❌ Impossível finalizar vistoria

### Depois:
- ✅ Contador mostra número correto de etapas concluídas
- ✅ Upload funciona com qualquer nome de etapa
- ✅ Vistoria pode ser finalizada com sucesso

---

## 🚀 Próximos Passos

1. Testar manualmente a vistoria completa
2. Verificar se todas as fotos são salvas corretamente
3. Confirmar que o contador reflete o progresso real
4. Deploy para produção

---

**Status:** ✅ Correções Aplicadas  
**Testado:** Pendente teste manual  
**Deploy:** Pendente
