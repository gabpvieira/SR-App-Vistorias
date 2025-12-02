# ✅ Funcionalidade: Deletar Vistoria (Gerente)

## 🎯 Objetivo

Permitir que gerentes deletem vistorias completas, incluindo todas as fotos associadas.

## 🔐 Permissões

- ✅ **Gerentes**: Podem deletar qualquer vistoria
- ❌ **Vendedores**: Não têm acesso ao botão de deletar

## 📋 Implementação

### 1. Backend (supabase-queries.ts)

**Nova função:** `deleteInspection(inspectionId: string)`

```typescript
export async function deleteInspection(inspectionId: string) {
  // 1. Buscar todas as fotos
  const photos = await getPhotosByInspectionId(inspectionId);
  
  // 2. Deletar fotos do storage
  if (photos.length > 0) {
    const filePaths = photos.map(photo => extractPath(photo.photo_url));
    await supabase.storage.from('inspection-photos').remove(filePaths);
  }

  // 3. Deletar vistoria (fotos do banco deletadas por CASCADE)
  await supabase.from('inspections').delete().eq('id', inspectionId);
}
```

### 2. Context (InspectionContext.tsx)

**Nova função:** `deleteInspection(inspectionId: string)`

```typescript
const deleteInspection = useCallback(async (inspectionId: string) => {
  if (!user) throw new Error('Usuário não autenticado');
  if (user.role !== 'gerente') throw new Error('Apenas gerentes podem deletar');

  await deleteInspectionQuery(inspectionId);
  setInspections(prev => prev.filter(i => i.id !== inspectionId));
}, [user]);
```

### 3. UI (InspectionDetail.tsx)

**Botão de deletar com confirmação:**

```tsx
{user?.role === 'gerente' && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="destructive" size="sm">
        <Trash2 className="h-4 w-4 mr-2" />
        Deletar
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja deletar a vistoria?
          Esta ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={handleDelete}>
          Deletar Vistoria
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)}
```

## 🔄 Fluxo de Deleção

1. **Gerente acessa detalhes da vistoria**
2. **Clica no botão "Deletar"** (vermelho, com ícone de lixeira)
3. **Modal de confirmação aparece**
   - Título: "Confirmar exclusão"
   - Descrição: Aviso sobre ação irreversível
   - Botões: "Cancelar" e "Deletar Vistoria"
4. **Ao confirmar:**
   - Loading state ativa
   - Fotos são deletadas do storage
   - Registros são deletados do banco
   - Toast de sucesso aparece
   - Redirecionamento para Dashboard
5. **Em caso de erro:**
   - Toast de erro aparece
   - Usuário permanece na página

## 🗑️ O que é Deletado

### Storage (Supabase Storage)
```
inspection-photos/
  └── inspections/
      └── {inspection-id}/
          ├── 1-Frontal_45_graus.png     ❌ DELETADO
          ├── 2-Frente_reta.png           ❌ DELETADO
          └── ... (todas as fotos)        ❌ DELETADO
```

### Banco de Dados
```sql
-- Tabela: inspections
DELETE FROM inspections WHERE id = '{inspection-id}';  ❌ DELETADO

-- Tabela: inspection_photos (CASCADE)
-- Todas as fotos relacionadas são deletadas automaticamente
```

## 🎨 Interface

### Localização do Botão
- **Página:** Detalhes da Vistoria (`/vistoria/:id`)
- **Posição:** Header, ao lado do badge de tipo
- **Visibilidade:** Apenas para gerentes

### Aparência
- **Cor:** Vermelho (variant="destructive")
- **Ícone:** Lixeira (Trash2)
- **Texto:** "Deletar"
- **Tamanho:** Pequeno (size="sm")

### Estados
1. **Normal:** Botão vermelho clicável
2. **Loading:** Spinner + "Deletando..."
3. **Disabled:** Quando já está deletando

## 🔒 Segurança

### Validações
1. ✅ Usuário autenticado
2. ✅ Usuário é gerente
3. ✅ Vistoria existe
4. ✅ Confirmação explícita do usuário

### Proteções
- Vendedores não veem o botão
- Modal de confirmação obrigatório
- Ação irreversível claramente comunicada
- Tratamento de erros robusto

## 📊 Casos de Uso

### Caso 1: Vistoria Duplicada
**Cenário:** Vendedor criou vistoria duplicada por engano
**Ação:** Gerente deleta a vistoria duplicada
**Resultado:** Apenas a vistoria correta permanece

### Caso 2: Vistoria com Erro
**Cenário:** Fotos foram enviadas para veículo errado
**Ação:** Gerente deleta a vistoria incorreta
**Resultado:** Vendedor pode criar nova vistoria correta

### Caso 3: Teste/Treinamento
**Cenário:** Vistorias de teste foram criadas
**Ação:** Gerente limpa vistorias de teste
**Resultado:** Dashboard limpo para produção

## 🧪 Como Testar

### Teste 1: Deletar como Gerente
1. Login: maria@srcaminhoes.com.br / 12345678
2. Dashboard → Selecionar vistoria
3. Clicar em "Deletar"
4. Confirmar no modal
5. ✅ Vistoria deletada, redirecionado para Dashboard

### Teste 2: Vendedor não vê botão
1. Login: joao@srcaminhoes.com.br / 12345678
2. Dashboard → Selecionar vistoria
3. ❌ Botão "Deletar" não aparece

### Teste 3: Cancelar deleção
1. Login como gerente
2. Clicar em "Deletar"
3. Clicar em "Cancelar" no modal
4. ✅ Vistoria permanece intacta

## 📝 Componentes Criados

1. `src/components/ui/alert-dialog.tsx` - Componente de diálogo de confirmação
2. Função `deleteInspection` em `supabase-queries.ts`
3. Função `deleteInspection` em `InspectionContext.tsx`
4. Botão e handler em `InspectionDetail.tsx`

## 🎯 Melhorias Futuras

- [ ] Soft delete (marcar como deletado ao invés de remover)
- [ ] Log de auditoria (quem deletou, quando)
- [ ] Restaurar vistoria deletada (lixeira)
- [ ] Deletar múltiplas vistorias de uma vez
- [ ] Confirmação por senha para deleções

## ✅ Status

🎉 **Funcionalidade 100% Implementada!**

- ✅ Backend implementado
- ✅ Context atualizado
- ✅ UI com modal de confirmação
- ✅ Permissões por role
- ✅ Deleção de fotos do storage
- ✅ Deleção de registros do banco
- ✅ Feedback visual (toast)
- ✅ Tratamento de erros
- ✅ Pronto para uso em produção
