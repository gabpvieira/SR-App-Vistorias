# Guia de Uso: Painel de Desempenho

## 🎯 Para Gerentes

### Como Acessar

1. **Login como Gerente**
   - Faça login com uma conta de gerente
   - O painel só está disponível para usuários com role `gerente`

2. **Navegação**
   - **Desktop**: Clique no ícone de gráfico (📊) no menu superior direito
   - **Mobile**: Abra o menu lateral e clique em "Desempenho"

### Visão Geral da Página

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Painel de Desempenho                    [Filtro Período] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │  6 Cards  │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Gráfico de Vistorias │ │ Distribuição         │          │
│ │ ao Longo do Tempo    │ │ (Tipo/Status)        │          │
│ └──────────────────────┘ └──────────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────┐          │
│ │ Ranking de Vendedores│ │ Atividades Recentes  │          │
│ └──────────────────────┘ └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Entendendo os KPIs

### 1. Total de Vistorias
- **O que é**: Número total de vistorias criadas no sistema
- **Uso**: Visão geral do volume de trabalho

### 2. Vistorias no Mês
- **O que é**: Vistorias criadas no mês atual
- **Indicador**: Seta verde (↗) = crescimento | Seta vermelha (↘) = queda
- **Comparação**: Percentual vs mês anterior
- **Uso**: Acompanhar tendência mensal

### 3. Média Diária
- **O que é**: Média de vistorias por dia no mês atual
- **Cálculo**: Vistorias do mês ÷ dias decorridos
- **Uso**: Avaliar ritmo de trabalho

### 4. Taxa de Conclusão
- **O que é**: Percentual de vistorias concluídas
- **Cálculo**: (Concluídas ÷ Total) × 100
- **Uso**: Medir eficiência da equipe

### 5. Total de Fotos
- **O que é**: Número total de fotos capturadas
- **Uso**: Avaliar volume de documentação

### 6. Total de Comentários
- **O que é**: Número total de comentários/interações
- **Uso**: Medir colaboração da equipe

---

## 📈 Usando os Gráficos

### Gráfico de Vistorias ao Longo do Tempo

**Visualização**: Gráfico de área com 3 linhas

- **Linha Azul**: Total de vistorias
- **Linha Roxa**: Vistorias de troca
- **Linha Verde**: Vistorias de manutenção

**Como usar**:
1. Passe o mouse sobre o gráfico para ver detalhes de cada dia
2. Identifique picos e quedas de produtividade
3. Compare tipos de vistoria ao longo do tempo

**Insights**:
- Dias com maior volume de trabalho
- Tendências de crescimento/queda
- Proporção entre tipos de vistoria

### Gráfico de Distribuição

**2 Abas Disponíveis**:

#### Por Tipo
- **Troca** (Azul): Vistorias de troca de veículo
- **Manutenção** (Verde): Vistorias de manutenção

#### Por Status
- **Rascunho** (Cinza): Vistorias não finalizadas
- **Concluída** (Verde): Vistorias finalizadas
- **Aprovada** (Ciano): Vistorias aprovadas
- **Rejeitada** (Vermelho): Vistorias rejeitadas

**Como usar**:
1. Clique nas abas para alternar entre visualizações
2. Veja percentuais diretamente no gráfico
3. Confira detalhes na legenda abaixo

**Insights**:
- Proporção de tipos de vistoria
- Taxa de conclusão visual
- Identificar gargalos (muitos rascunhos)

---

## 🏆 Ranking de Vendedores

### Colunas da Tabela

| Coluna | Descrição |
|--------|-----------|
| **Rank** | Posição no ranking (🏆 🥈 🥉 ou #4, #5...) |
| **Vendedor** | Nome e email do vendedor |
| **Total** | Total de vistorias criadas |
| **Mês** | Vistorias no mês atual |
| **Taxa** | Taxa de conclusão (%) |
| **Última Vistoria** | Tempo desde a última vistoria |

### Ordenação

**Clique nos cabeçalhos** para ordenar:
- **Total**: Ordena por total de vistorias
- **Mês**: Ordena por vistorias do mês
- **Taxa**: Ordena por taxa de conclusão

**Dica**: Clique novamente para inverter a ordem (crescente/decrescente)

### Interpretação das Cores

**Taxa de Conclusão**:
- 🟢 **Verde** (≥80%): Excelente desempenho
- 🟡 **Amarelo** (50-79%): Desempenho médio
- 🔴 **Vermelho** (<50%): Precisa melhorar

### Como Usar

1. **Identificar Top Performers**: Veja quem está no topo
2. **Reconhecer Esforços**: Use para feedback positivo
3. **Identificar Necessidades**: Vendedores com baixa taxa podem precisar de suporte
4. **Acompanhar Evolução**: Compare mês a mês

---

## 🕐 Atividades Recentes

### Tipos de Atividades

| Ícone | Tipo | Descrição |
|-------|------|-----------|
| 📄 | Nova Vistoria | Vistoria criada |
| ✅ | Concluída | Vistoria finalizada |
| 💬 | Comentário | Comentário adicionado |
| ➕ | Atividade | Atividade extra adicionada |

### Informações Exibidas

- **Tipo da atividade** (badge colorido)
- **Tempo relativo** (há 5 minutos, há 2 horas, etc.)
- **Detalhes** (placa do veículo, texto do comentário, etc.)
- **Autor** (nome do usuário)

### Como Usar

1. **Acompanhar em Tempo Real**: Veja o que está acontecendo agora
2. **Clicar para Detalhes**: Clique em qualquer atividade para ir direto à vistoria
3. **Identificar Padrões**: Veja horários de maior atividade
4. **Monitorar Colaboração**: Acompanhe comentários e interações

---

## 🔍 Filtro de Período

### Opções Disponíveis

| Período | Dias | Uso Recomendado |
|---------|------|-----------------|
| **Última semana** | 7 | Acompanhamento diário |
| **Último mês** | 30 | Análise mensal (padrão) |
| **Últimos 3 meses** | 90 | Tendências trimestrais |
| **Último ano** | 365 | Visão anual |

### Como Usar

1. Clique no seletor de período (canto superior direito)
2. Escolha o período desejado
3. Todos os dados serão atualizados automaticamente

**Dica**: Use períodos maiores para identificar tendências de longo prazo

---

## 💡 Casos de Uso

### 1. Reunião Semanal de Equipe

**Objetivo**: Revisar desempenho da semana

**Passos**:
1. Selecione "Última semana" no filtro
2. Revise os KPIs principais
3. Analise o gráfico de vistorias por dia
4. Discuta o ranking de vendedores
5. Reconheça top performers

### 2. Planejamento Mensal

**Objetivo**: Definir metas para o próximo mês

**Passos**:
1. Selecione "Último mês" no filtro
2. Compare com mês anterior (veja % de crescimento)
3. Identifique dias de pico e baixa
4. Analise distribuição de tipos
5. Defina metas baseadas em dados

### 3. Avaliação Individual

**Objetivo**: Feedback para vendedor específico

**Passos**:
1. Localize o vendedor no ranking
2. Veja total de vistorias e taxa de conclusão
3. Filtre atividades recentes (mentalmente)
4. Compare com média da equipe
5. Prepare feedback construtivo

### 4. Identificação de Problemas

**Objetivo**: Encontrar gargalos

**Passos**:
1. Verifique taxa de conclusão geral
2. Analise distribuição por status
3. Se muitos rascunhos: investigar motivos
4. Se baixa taxa: verificar processos
5. Tomar ações corretivas

### 5. Relatório para Diretoria

**Objetivo**: Apresentar resultados

**Passos**:
1. Selecione "Últimos 3 meses" ou "Último ano"
2. Capture screenshots dos gráficos
3. Destaque crescimento mensal
4. Mostre ranking de top performers
5. Apresente insights e próximos passos

---

## 📱 Uso Mobile

### Adaptações Mobile

- **KPIs**: Empilhados verticalmente (2 por linha)
- **Gráficos**: Largura total, scroll horizontal se necessário
- **Ranking**: Scroll horizontal na tabela
- **Atividades**: Lista vertical com scroll

### Dicas Mobile

1. **Rotacione o dispositivo** para melhor visualização de gráficos
2. **Use gestos de pinça** para zoom em gráficos
3. **Toque e segure** em atividades para mais opções
4. **Scroll suave** para navegar entre seções

---

## ⚡ Dicas e Truques

### Produtividade

1. **Favoritar a Página**: Adicione aos favoritos para acesso rápido
2. **Verificar Diariamente**: Acompanhe atividades recentes todo dia
3. **Usar em Reuniões**: Compartilhe tela durante reuniões
4. **Comparar Períodos**: Alterne entre filtros para comparações

### Análise de Dados

1. **Identifique Padrões**: Dias da semana com mais vistorias
2. **Correlacione Eventos**: Relacione picos com ações da equipe
3. **Acompanhe Tendências**: Use períodos longos para ver evolução
4. **Aja nos Dados**: Use insights para tomar decisões

### Gestão de Equipe

1. **Reconheça Publicamente**: Compartilhe ranking em reuniões
2. **Apoie Quem Precisa**: Identifique e ajude vendedores com dificuldades
3. **Defina Metas Realistas**: Baseie-se em médias históricas
4. **Celebre Conquistas**: Comemore quando metas são atingidas

---

## ❓ Perguntas Frequentes

### P: Por que não vejo a página de Desempenho?
**R**: A página é exclusiva para gerentes. Verifique se seu usuário tem role `gerente`.

### P: Os dados estão desatualizados?
**R**: Os dados são carregados em tempo real. Recarregue a página (F5) se necessário.

### P: Posso exportar os dados?
**R**: Atualmente não há exportação automática. Use screenshots ou copie dados manualmente. (Funcionalidade planejada para versão futura)

### P: Como interpretar a taxa de conclusão?
**R**: É o percentual de vistorias que foram finalizadas (status "concluída"). Quanto maior, melhor.

### P: O que significa o percentual no card "Vistorias no Mês"?
**R**: É a variação percentual comparada ao mês anterior. Verde = crescimento, Vermelho = queda.

### P: Posso filtrar por vendedor específico?
**R**: Atualmente não há filtro por vendedor na página de Desempenho. Use o Dashboard principal para isso. (Funcionalidade planejada para versão futura)

### P: Os gráficos não aparecem no mobile?
**R**: Os gráficos são responsivos. Se não aparecerem, tente rotacionar o dispositivo ou recarregar a página.

---

## 🎯 Métricas de Sucesso

Use o painel para acompanhar estas métricas:

### Curto Prazo (Semanal)
- [ ] Média diária de vistorias
- [ ] Taxa de conclusão semanal
- [ ] Atividades recentes

### Médio Prazo (Mensal)
- [ ] Total de vistorias no mês
- [ ] Crescimento vs mês anterior
- [ ] Ranking de vendedores

### Longo Prazo (Trimestral/Anual)
- [ ] Tendências de crescimento
- [ ] Evolução da taxa de conclusão
- [ ] Performance individual ao longo do tempo

---

## 📞 Suporte

Se encontrar problemas ou tiver sugestões:
1. Verifique este guia primeiro
2. Consulte a documentação técnica
3. Entre em contato com o suporte técnico

---

**Última Atualização**: 07/12/2025  
**Versão**: 1.0  
**Desenvolvido para**: SR Caminhões
