# Sistema de Feedback em Produção

## Visão Geral

Sistema implementado para permitir que clientes avaliem funcionalidades e etapas de vistoria em produção, sem afetar dados reais do sistema.

## Funcionalidades

### Para Clientes (Produção)
- ✅ Aprovar etapas de vistoria
- ❌ Reprovar etapas de vistoria  
- 🗑️ Ocultar etapas que não deseja utilizar
- 💬 Deixar comentários opcionais

### Para Gerentes/Desenvolvedores
- 📊 Painel completo de visualização de feedbacks
- 🔍 Filtros por tipo de vistoria, status e ambiente
- 📈 Estatísticas de aprovação/reprovação
- 🕐 Histórico completo com timestamps

## Arquitetura

### Banco de Dados (Supabase)

**Tabela: `feature_feedback`**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | Referência ao usuário |
| feature_type | TEXT | Tipo: vistoria_etapa, funcionalidade_geral, interface, fluxo |
| vistoria_tipo | TEXT | cavalo, rodotrem_basculante, rodotrem_graneleiro, livre, troca, manutencao |
| etapa_id | TEXT | ID da etapa (ex: cavalo-1) |
| etapa_label | TEXT | Label legível da etapa |
| status | TEXT | approved, rejected, hidden, pending |
| comentario | TEXT | Comentário opcional |
| ambiente | TEXT | production ou development |
| created_at | TIMESTAMPTZ | Data de criação |
| updated_at | TIMESTAMPTZ | Data de atualização |

### Frontend

**Arquivos criados:**

```
src/
├── types/
│   └── feedback.ts          # Tipos TypeScript
├── lib/
│   └── feedback-service.ts  # Serviço de API
├── hooks/
│   └── useFeedback.ts       # Hook React
├── components/
│   ├── StepFeedbackButtons.tsx   # Botões de feedback
│   └── StepFeedbackWrapper.tsx   # Wrapper para etapas
└── pages/
    └── FeedbackPanel.tsx    # Painel de visualização
```

## Como Usar

### 1. Integrar feedback em etapas de vistoria

```tsx
import { StepFeedbackWrapper } from '@/components/StepFeedbackWrapper';

<StepFeedbackWrapper
  userId={user.id}
  vistoriaTipo="cavalo"
  etapaId="cavalo-1"
  etapaLabel="Foto Frontal"
>
  {/* Conteúdo da etapa */}
</StepFeedbackWrapper>
```

### 2. Usar botões de feedback diretamente

```tsx
import { StepFeedbackButtons } from '@/components/StepFeedbackButtons';
import { useFeedback } from '@/hooks/useFeedback';

const { approveStep, rejectStep, hideStep, getStepStatus } = useFeedback({
  userId: user.id,
  vistoriaTipo: 'cavalo'
});

<StepFeedbackButtons
  etapaId="cavalo-1"
  etapaLabel="Foto Frontal"
  currentStatus={getStepStatus('cavalo-1')}
  onApprove={approveStep}
  onReject={rejectStep}
  onHide={hideStep}
/>
```

### 3. Filtrar etapas ocultas

```tsx
import { useFilteredSteps } from '@/components/StepFeedbackWrapper';

const { filteredSteps, hiddenCount } = useFilteredSteps(
  steps,
  user.id,
  'cavalo'
);
```

## Rotas

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/feedback` | Painel de feedback | Gerentes |
| `/dashboard` (tab Feedback) | Acesso rápido ao painel | Gerentes |

## Regras de Negócio

1. **Isolamento de dados**: Feedbacks não afetam dados reais de vistorias
2. **Segurança**: Usuários só veem seus próprios feedbacks (exceto gerentes)
3. **Persistência**: Etapas ocultas continuam existindo no sistema
4. **Cache**: LocalStorage usado para melhorar performance
5. **Ambiente**: Feedback registra se foi criado em produção ou desenvolvimento

## Políticas RLS (Row Level Security)

- Usuários podem ver/criar/atualizar apenas seus próprios feedbacks
- Gerentes podem visualizar todos os feedbacks
- Nenhum usuário pode deletar feedbacks (apenas resetar status)

## Próximos Passos (Sugestões)

1. [ ] Integrar botões de feedback na página GuidedInspection
2. [ ] Adicionar notificações quando novo feedback é recebido
3. [ ] Exportar relatório de feedbacks em PDF/CSV
4. [ ] Dashboard com gráficos de tendência de feedbacks
5. [ ] Sistema de priorização baseado em feedbacks negativos
