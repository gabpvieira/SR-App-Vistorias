# Planejamento: Painel de Desempenho para Admin/Gerente

## 📋 Contexto do Sistema

### Sistema Atual
- **Aplicação**: Sistema de Vistoria de Veículos SR Caminhões
- **Usuários**: Vendedores e Gerentes
- **Funcionalidades Principais**:
  - Criação de vistorias (troca/manutenção)
  - Vistorias guiadas por modelo de veículo
  - Atividades adicionais em vistorias
  - Sistema de comentários colaborativos
  - Gerenciamento de usuários (gerentes)
  - Upload de fotos com marca d'água

### Banco de Dados (Supabase)
**Tabelas Principais**:
- `users` - Usuários (vendedores/gerentes)
- `inspections` - Vistorias de veículos
- `inspection_photos` - Fotos das vistorias
- `inspection_activities` - Atividades adicionais
- `inspection_comments` - Comentários colaborativos
- `inspection_comment_likes` - Curtidas em comentários

---

## 🎯 Objetivo

Criar uma página de **Desempenho** exclusiva para gerentes, com visualizações profissionais de dados e métricas que permitam:
- Monitorar produtividade da equipe
- Identificar tendências e padrões
- Tomar decisões baseadas em dados
- Acompanhar atividades recentes

---

## 📊 Métricas e Visualizações

### 1. **Cards de Resumo (KPIs)**
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Vistorias │ Mês Atual       │ Média Diária    │ Taxa Conclusão  │
│ 1,234           │ 156 (+12%)      │ 5.2 vistorias   │ 87%             │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Métricas**:
- Total de vistorias (geral)
- Vistorias no mês atual (com % comparado ao mês anterior)
- Média diária de vistorias
- Taxa de conclusão (concluídas vs rascunho)
- Total de fotos capturadas
- Total de comentários/interações

### 2. **Ranking de Usuários**
Tabela ordenável com:
- Nome do vendedor
- Total de vistorias
- Vistorias no mês
- Última vistoria
- Taxa de conclusão
- Badge de destaque (top 3)

**Ordenação**: Por total, por mês, por taxa de conclusão

### 3. **Gráfico de Vistorias por Período**
- Gráfico de linha/área mostrando vistorias ao longo do tempo
- Filtros: Última semana, último mês, últimos 3 meses, último ano
- Comparação com período anterior
- Separação por tipo (troca/manutenção)

### 4. **Distribuição por Tipo**
- Gráfico de pizza/donut:
  - Troca vs Manutenção
  - Status (rascunho, concluída, aprovada, rejeitada)
  - Modelo de veículo (cavalo, rodotrem, etc)

### 5. **Atividades Recentes**
Timeline com:
- Últimas 20 atividades do sistema
- Tipos: Nova vistoria, Vistoria concluída, Comentário adicionado, Atividade extra
- Filtro por tipo de atividade
- Filtro por usuário
- Link direto para a vistoria

### 6. **Estatísticas de Engajamento**
- Total de comentários
- Média de comentários por vistoria
- Usuários mais ativos em comentários
- Curtidas totais

### 7. **Análise de Produtividade**
- Heatmap de vistorias por dia da semana
- Horários de pico (se tivermos timestamp)
- Tempo médio entre criação e conclusão

---

## 🎨 Design e UX

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header (com navegação)                                       │
├─────────────────────────────────────────────────────────────┤
│ Título: Painel de Desempenho                                │
│ Filtros: [Período] [Vendedor] [Tipo]                       │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│ │ KPI │ │ KPI │ │ KPI │ │ KPI │  Cards de Resumo          │
│ └─────┘ └─────┘ └─────┘ └─────┘                           │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Gráfico de Vistorias │ │ Distribuição por     │          │
│ │ ao Longo do Tempo    │ │ Tipo/Status          │          │
│ └──────────────────────┘ └──────────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Ranking de Usuários  │ │ Atividades Recentes  │          │
│ │ (Tabela)             │ │ (Timeline)           │          │
│ └──────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Componentes UI
- **shadcn/ui**: Card, Table, Badge, Select, Tabs
- **Gráficos**: Recharts (biblioteca React para gráficos)
- **Ícones**: Lucide React
- **Cores**: Sistema de cores do tema atual
- **Responsivo**: Mobile-first, adaptável

---

## 🔧 Implementação Técnica

### 1. Queries Supabase

#### Query: Estatísticas Gerais
```sql
-- Total de vistorias, por mês, taxa de conclusão
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as this_month,
  COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE) - interval '1 month' 
                   AND created_at < date_trunc('month', CURRENT_DATE)) as last_month,
  COUNT(*) FILTER (WHERE status = 'concluida') as completed,
  COUNT(*) FILTER (WHERE status = 'rascunho') as draft
FROM inspections;
```

#### Query: Ranking de Usuários
```sql
SELECT 
  u.id,
  u.name,
  u.email,
  COUNT(i.id) as total_inspections,
  COUNT(i.id) FILTER (WHERE i.created_at >= date_trunc('month', CURRENT_DATE)) as month_inspections,
  MAX(i.created_at) as last_inspection,
  COUNT(i.id) FILTER (WHERE i.status = 'concluida') as completed_count,
  ROUND(COUNT(i.id) FILTER (WHERE i.status = 'concluida')::numeric / NULLIF(COUNT(i.id), 0) * 100, 1) as completion_rate
FROM users u
LEFT JOIN inspections i ON u.id = i.user_id
WHERE u.role = 'vendedor'
GROUP BY u.id, u.name, u.email
ORDER BY total_inspections DESC;
```

#### Query: Vistorias por Dia (últimos 30 dias)
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE type = 'troca') as troca_count,
  COUNT(*) FILTER (WHERE type = 'manutencao') as manutencao_count
FROM inspections
WHERE created_at >= CURRENT_DATE - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

#### Query: Atividades Recentes
```sql
-- União de diferentes tipos de atividades
SELECT 
  'inspection_created' as activity_type,
  i.id as reference_id,
  i.created_at as timestamp,
  u.name as user_name,
  i.vehicle_plate as details
FROM inspections i
JOIN users u ON i.user_id = u.id
WHERE i.created_at >= CURRENT_DATE - interval '7 days'

UNION ALL

SELECT 
  'inspection_completed' as activity_type,
  i.id as reference_id,
  i.completed_at as timestamp,
  u.name as user_name,
  i.vehicle_plate as details
FROM inspections i
JOIN users u ON i.user_id = u.id
WHERE i.completed_at >= CURRENT_DATE - interval '7 days'

UNION ALL

SELECT 
  'comment_added' as activity_type,
  c.inspection_id as reference_id,
  c.created_at as timestamp,
  u.name as user_name,
  LEFT(c.content, 50) as details
FROM inspection_comments c
JOIN users u ON c.user_id = u.id
WHERE c.created_at >= CURRENT_DATE - interval '7 days'

ORDER BY timestamp DESC
LIMIT 20;
```

### 2. Estrutura de Arquivos

```
src/
├── pages/
│   └── Performance.tsx          # Página principal
├── components/
│   ├── performance/
│   │   ├── PerformanceKPIs.tsx       # Cards de KPIs
│   │   ├── UserRanking.tsx           # Tabela de ranking
│   │   ├── InspectionChart.tsx       # Gráfico de vistorias
│   │   ├── DistributionChart.tsx     # Gráfico de distribuição
│   │   ├── RecentActivities.tsx      # Timeline de atividades
│   │   └── EngagementStats.tsx       # Estatísticas de engajamento
├── lib/
│   └── performance-queries.ts   # Queries específicas de performance
└── hooks/
    └── usePerformanceData.ts    # Hook customizado para dados
```

### 3. Rota e Navegação

**Rota**: `/desempenho` ou `/performance`

**Acesso**: Apenas gerentes (role === 'gerente')

**Navegação**: Adicionar no Header e menu mobile

---

## 📦 Dependências Necessárias

```json
{
  "recharts": "^2.10.0"  // Biblioteca de gráficos React
}
```

---

## 🚀 Plano de Implementação

### Fase 1: Estrutura Base
1. ✅ Criar documento de planejamento
2. ⬜ Instalar dependências (recharts)
3. ⬜ Criar queries de performance no Supabase
4. ⬜ Criar hook `usePerformanceData`
5. ⬜ Criar página base `Performance.tsx`
6. ⬜ Adicionar rota e proteção de acesso

### Fase 2: Componentes de Visualização
7. ⬜ Implementar `PerformanceKPIs` (cards de resumo)
8. ⬜ Implementar `UserRanking` (tabela de ranking)
9. ⬜ Implementar `InspectionChart` (gráfico de linha)
10. ⬜ Implementar `DistributionChart` (gráfico de pizza)

### Fase 3: Atividades e Engajamento
11. ⬜ Implementar `RecentActivities` (timeline)
12. ⬜ Implementar `EngagementStats` (estatísticas)

### Fase 4: Filtros e Refinamentos
13. ⬜ Adicionar filtros de período
14. ⬜ Adicionar filtros de vendedor
15. ⬜ Adicionar filtros de tipo
16. ⬜ Implementar exportação de dados (opcional)

### Fase 5: Testes e Ajustes
17. ⬜ Testar responsividade
18. ⬜ Testar performance com dados reais
19. ⬜ Ajustes de UX/UI
20. ⬜ Documentação final

---

## 🎨 Paleta de Cores para Gráficos

```typescript
const chartColors = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  troca: '#3b82f6',      // Azul
  manutencao: '#10b981', // Verde
  rascunho: '#94a3b8',   // Cinza
  concluida: '#22c55e',  // Verde claro
  aprovada: '#06b6d4',   // Ciano
  rejeitada: '#ef4444',  // Vermelho
};
```

---

## 📱 Responsividade

- **Desktop (>1024px)**: Layout em grid 2x2 para gráficos
- **Tablet (768-1024px)**: Layout em coluna única, gráficos empilhados
- **Mobile (<768px)**: Cards compactos, gráficos simplificados, tabelas com scroll horizontal

---

## 🔒 Segurança e Permissões

- Verificar `user.role === 'gerente'` antes de renderizar
- Redirect para dashboard se não for gerente
- Queries otimizadas para não expor dados sensíveis
- RLS policies já configuradas no Supabase

---

## 📈 Métricas de Sucesso

- Tempo de carregamento < 2s
- Visualizações claras e intuitivas
- Dados atualizados em tempo real
- Interface responsiva em todos os dispositivos
- Feedback positivo dos gerentes

---

## 🔄 Melhorias Futuras (Fase 2)

- Exportação de relatórios em PDF/Excel
- Notificações de metas atingidas
- Comparação entre períodos customizados
- Previsões baseadas em histórico
- Dashboard personalizável (drag & drop)
- Filtros salvos
- Alertas automáticos

---

**Data de Criação**: 07/12/2025  
**Versão**: 1.0  
**Status**: Planejamento Completo ✅
