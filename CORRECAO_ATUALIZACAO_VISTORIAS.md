# Correção: Atualização Automática de Vistorias

## Problema Identificado

As vistorias criadas não apareciam automaticamente no Dashboard após serem criadas. Era necessário recarregar a página manualmente.

## Diagnóstico (via MCP Supabase)

Usando o MCP Supabase, verificamos que:
1. As vistorias estavam sendo criadas corretamente no banco de dados
2. O problema era apenas de atualização do frontend
3. O contexto não estava recarregando as vistorias automaticamente

### Vistorias no Banco
- Vistoria 1: Criada pelo gerente (gerencia@srcaminhoes.com.br)
- Vistoria 2: Criada pelo vendedor Gabriel (eugabrieldpv@gmail.com)

## Soluções Implementadas

### 1. Listener de Foco na Janela
**Arquivo**: `src/contexts/InspectionContext.tsx`

Adicionado um listener que recarrega as vistorias quando a janela recebe foco:

```typescript
useEffect(() => {
  const handleFocus = () => {
    loadInspections();
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, [loadInspections]);
```

**Benefício**: Quando o usuário volta para a aba do navegador, as vistorias são atualizadas automaticamente.

### 2. Refresh no Dashboard
**Arquivo**: `src/pages/Dashboard.tsx`

Adicionado um useEffect que recarrega as vistorias quando o Dashboard é montado:

```typescript
useEffect(() => {
  refreshInspections();
}, [refreshInspections]);
```

**Benefício**: Sempre que o usuário navega para o Dashboard, as vistorias são recarregadas.

### 3. Função refreshInspections Exposta
**Arquivo**: `src/contexts/InspectionContext.tsx`

A função `refreshInspections` já estava disponível no contexto, mas não estava sendo usada:

```typescript
refreshInspections: loadInspections
```

**Benefício**: Permite que qualquer componente force uma atualização das vistorias.

## Comportamento Esperado

Agora as vistorias são atualizadas automaticamente em 3 situações:

1. **Ao montar o Dashboard**: Quando o usuário acessa a página
2. **Ao focar na janela**: Quando o usuário volta para a aba do navegador
3. **Após criar uma vistoria**: A vistoria é adicionada ao estado local imediatamente

## Arquivos Modificados

- `src/contexts/InspectionContext.tsx`: Adicionado listener de foco
- `src/pages/Dashboard.tsx`: Adicionado refresh ao montar o componente

## Teste Realizado

Criada vistoria de teste via MCP Supabase:
- Placa: TEST-1234
- Tipo: Troca
- Usuário: Gabriel Moderador (eugabrieldpv@gmail.com)
- Status: Confirmado no banco de dados ✓

## Correção Adicional: Campo 'photos' Inválido

### Problema
Ao tentar criar uma vistoria, o erro ocorria:
```
Could not find the 'photos' column of 'inspections' in the schema cache
```

### Causa
O componente `NewInspection.tsx` estava tentando passar um campo `photos` para a função `addInspection`, mas:
1. A tabela `inspections` não tem uma coluna `photos`
2. As fotos são armazenadas em uma tabela separada (`inspection_photos`)
3. A interface `Inspection` não inclui o campo `photos`

### Solução
**Arquivo**: `src/pages/NewInspection.tsx`

Removido o campo `photos` e ajustados os nomes dos campos para corresponder à interface:
- `plate` → `vehicle_plate`
- `observations` → `notes`
- Removido: `photos`
- Adicionados campos obrigatórios: `is_guided_inspection`, `guided_photos_complete`, `status`

**Arquivo**: `src/contexts/InspectionContext.tsx`

Garantido que o `user_id` seja sempre preenchido com o ID do usuário logado:
```typescript
const dataWithUser = {
  ...inspectionData,
  user_id: user.id,
};
```

## Próximos Passos

Se o problema persistir, considerar:
1. Adicionar um botão manual de refresh no Dashboard
2. Implementar polling periódico (a cada X segundos)
3. Implementar WebSocket/Realtime do Supabase para atualizações em tempo real

## Arquivos Modificados (Atualizado)

- `src/contexts/InspectionContext.tsx`: Adicionado listener de foco + garantia de user_id
- `src/pages/Dashboard.tsx`: Adicionado refresh ao montar o componente
- `src/pages/NewInspection.tsx`: Corrigido campos da vistoria (removido 'photos', ajustado nomes)
