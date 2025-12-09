# Atualização das Etapas de Vistoria Guiada - CAVALO

## ✅ Alterações Implementadas

### 1. Nova Ordem das Etapas (Total: 9 etapas)

As etapas de vistoria guiada do cavalo foram reorganizadas para seguir a seguinte ordem:

1. **Frontal 45° – Lado Motorista**
   - Fotografe a cabine em ângulo de 45° do lado do motorista
   - 1 foto obrigatória

2. **Lateral Completa – Lado Motorista**
   - Capture toda a lateral esquerda do cavalo (lado do motorista)
   - 1 foto obrigatória

3. **Lateral Completa – Lado Passageiro**
   - Capture toda a lateral direita do cavalo (lado do passageiro)
   - 1 foto obrigatória

4. **Traseira – Área de Suspensão**
   - Fotografe a parte traseira do cavalo mecânico, focando na área de suspensão
   - 1 foto obrigatória

5. **Pneus Dianteiros (mínimo 2 fotos)**
   - Tire uma foto de cada pneu dianteiro (direito e esquerdo)
   - **Mínimo: 2 fotos | Máximo: 2 fotos**
   - Permite múltiplas fotos

6. **Painel Interno**
   - Fotografe o painel interno mostrando o volante e detalhes 
   - 1 foto obrigatória

7. **Lateral Passageiro com Plaqueta do Banco**
   - Fotografe o lado do passageiro mostrando a plaqueta do banco
   - **Mínimo: 1 foto | Máximo: 2 fotos**
   - Permite até 2 fotos caso a plaqueta esteja de difícil acesso

8. **Detalhes em Observação (até 10 fotos)**
   - Adicione fotos extras de detalhes específicos do cavalo que precisam ser registrados
   - **Mínimo: 1 foto | Máximo: 10 fotos**
   - Permite upload de até 10 imagens extras

9. **Documento CRLV**
   - Fotografe o documento CRLV do veículo de forma legível
   - 1 foto obrigatória

---

## 🔧 Alterações Técnicas

### Banco de Dados (Supabase)

**Migração aplicada:** `update_cavalo_inspection_steps_order`

- Deletadas todas as etapas antigas do cavalo (13 etapas)
- Inseridas 9 novas etapas na ordem correta
- Ajustado o `step_order` para refletir a nova sequência

### Código Frontend

**Arquivo:** `src/pages/GuidedInspection.tsx`

#### Melhorias implementadas:

1. **Detecção inteligente de etapas com múltiplas fotos**
   - Identifica etapas que permitem múltiplas fotos através do label
   - Suporta diferentes limites por tipo de etapa

2. **Validação dinâmica de quantidade de fotos**
   - Pneus Dianteiros: exatamente 2 fotos
   - Plaqueta do Banco: 1 a 2 fotos
   - Detalhes em Observação: 1 a 10 fotos

3. **Mensagens contextuais**
   - Feedback específico para cada tipo de etapa
   - Indicação clara de mínimo e máximo de fotos
   - Alertas quando o limite é atingido

4. **Contador de progresso ajustado**
   - Agora reflete corretamente 9 etapas totais
   - Progresso calculado como: `(etapa_atual / 9) * 100%`

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Total de etapas | 13 | 9 |
| Etapas com múltiplas fotos | 1 (pneus traseiros) | 3 (pneus dianteiros, plaqueta, detalhes) |
| Fotos de chassi | 2 etapas separadas | Removidas |
| Fotos de pneus | 2 etapas | 1 etapa (dianteiros) |
| Fotos de interior | 2 etapas | 2 etapas (painel + plaqueta) |
| Documento CRLV | Não incluído | Incluído como etapa final |

---

## ✨ Benefícios

1. **Processo mais ágil**: Redução de 13 para 9 etapas
2. **Flexibilidade**: Etapas com múltiplas fotos permitem melhor documentação
3. **Clareza**: Instruções mais específicas e objetivas
4. **Conformidade**: Inclusão obrigatória do documento CRLV
5. **Progresso preciso**: Contador reflete exatamente o andamento da vistoria

---

## 🧪 Como Testar

1. Acesse a aplicação e inicie uma nova vistoria
2. Selecione o modelo "Cavalo"
3. Verifique se as 9 etapas aparecem na ordem correta
4. Teste as etapas com múltiplas fotos:
   - Etapa 5: Tente adicionar mais de 2 fotos (deve bloquear)
   - Etapa 7: Adicione 1 ou 2 fotos
   - Etapa 8: Adicione até 10 fotos
5. Confirme que o progresso é calculado corretamente (11%, 22%, 33%, etc.)
6. Finalize a vistoria e verifique se todas as fotos foram salvas

---

## 📝 Observações

- As vistorias antigas (com 13 etapas) continuam funcionando normalmente
- Apenas novas vistorias seguirão o novo fluxo de 9 etapas
- O sistema detecta automaticamente qual template usar baseado no `vehicle_model`
- Todas as fotos continuam sendo salvas com marca d'água

---

**Data da atualização:** 09/12/2025
**Migração aplicada com sucesso:** ✅
**Código atualizado:** ✅
**Testado:** Pendente
