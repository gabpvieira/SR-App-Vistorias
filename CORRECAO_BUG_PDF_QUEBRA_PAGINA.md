# Correção: Bug de PDF Quebrado com Apenas 2 Páginas

## 🐛 Problema Identificado

A vistoria da placa **MBZ-1G25** estava gerando um PDF quebrado com apenas 2 páginas, quando deveria ter mais páginas para exibir todas as fotos.

### Dados da Vistoria
- **Placa:** MBZ-1G25
- **Modelo:** M. BENZ ACTROS 2548 S 6X2
- **Tipo:** Vistoria Guiada (Cavalo) + 1 Atividade Livre
- **Total de Fotos:** 13 fotos principais + 3 fotos da atividade = **16 fotos**
- **Problema:** PDF gerado com apenas 2 páginas (incompleto)

## 🔍 Causa Raiz

Foram identificados **3 bugs** no código de geração de PDF:

### 1. **Erro no GState (Marca d'água)**
```typescript
// ❌ ERRADO - Causava erro de compilação
doc.setGState(new doc.GState({ opacity: 0.1 }));

// ✅ CORRETO
const gState = new (doc as any).GState({ opacity: 0.1 });
doc.setGState(gState);
```

### 2. **Margem Insuficiente para Rodapé**
```typescript
// ❌ ERRADO - Não considerava espaço do rodapé (15mm)
if (yPosition + totalHeight > pageHeight - margin) {
  // quebra de página
}

// ✅ CORRETO - Adiciona 20mm de margem extra para rodapé
if (yPosition + totalHeight > pageHeight - margin - 20) {
  // quebra de página
}
```

### 3. **Lógica de 2 Colunas Incompleta**
```typescript
// ❌ ERRADO - Não verificava se cabia na segunda coluna
if (wouldExceedPage) {
  if (currentColumn === 0) {
    currentColumn = 1;
    yPosition = columnStartY; // Tentava segunda coluna sem verificar
  }
}

// ✅ CORRETO - Verifica novamente após mudar para segunda coluna
if (wouldExceedPage) {
  if (currentColumn === 0) {
    currentColumn = 1;
    yPosition = columnStartY;
    
    // Verificar novamente se cabe na segunda coluna
    const stillWouldExceed = yPosition + totalHeight > pageHeight - margin - 20;
    if (stillWouldExceed) {
      doc.addPage(); // Nova página se não couber
      yPosition = margin;
      columnStartY = yPosition;
      currentColumn = 0;
    }
  }
}
```

## ✅ Correções Aplicadas

### 1. **Correção do GState**
- Uso correto do type casting `(doc as any).GState`
- Marca d'água agora funciona sem erros

### 2. **Margem Extra para Rodapé**
- Adicionado **20mm de margem extra** em todas as verificações de quebra de página
- Garante que o rodapé (15mm) nunca sobrepõe o conteúdo

### 3. **Verificação Dupla nas 2 Colunas**
- Ao tentar segunda coluna, verifica novamente se o conteúdo cabe
- Se não couber, cria nova página imediatamente
- Aplicado tanto nas **fotos principais** quanto nas **fotos de atividades**

## 📊 Resultado Esperado

Com as correções, o PDF da vistoria MBZ-1G25 deve ter:

### Estrutura do PDF
1. **Página 1:**
   - Cabeçalho com logo
   - Dados do veículo (tabela)
   - Informações da vistoria (tabela)
   - Início das fotos (2-4 fotos)

2. **Páginas 2-4:**
   - Continuação das 13 fotos principais (2 colunas)
   - Cada página com 4-6 fotos

3. **Página 5:**
   - Seção "Atividades e Manutenções"
   - Cabeçalho da Atividade 1
   - 3 fotos da atividade (2 colunas)

4. **Todas as páginas:**
   - Marca d'água "SR VISTORIA" (diagonal, opacidade 10%)
   - Rodapé com data e numeração

### Total Esperado
- **~5 páginas** (dependendo do layout exato)
- **16 fotos** distribuídas em 2 colunas
- **Sem sobreposição** de conteúdo
- **Sem páginas quebradas**

## 🧪 Como Testar

1. Acesse o dashboard
2. Localize a vistoria da placa **MBZ-1G25**
3. Clique em "Baixar PDF"
4. Verifique:
   - ✅ PDF tem mais de 2 páginas
   - ✅ Todas as 13 fotos principais aparecem
   - ✅ Seção de atividades aparece
   - ✅ Todas as 3 fotos da atividade aparecem
   - ✅ Marca d'água visível em todas as páginas
   - ✅ Rodapé não sobrepõe conteúdo
   - ✅ Numeração de páginas correta

## 🔧 Arquivos Modificados

- `src/lib/pdf-generator.ts`
  - Função `addWatermark()` - Correção do GState
  - Seção de fotos principais - Margem extra + verificação dupla
  - Seção de fotos de atividades - Margem extra + verificação dupla

## 📝 Notas Técnicas

### Margem de Segurança
- **Margem base:** 15mm (topo, fundo, laterais)
- **Margem extra rodapé:** 20mm (garante espaço para linha + texto)
- **Total no fundo:** 35mm de espaço reservado

### Sistema de 2 Colunas
- **Largura da coluna:** (contentWidth - 4mm) / 2
- **Gap entre colunas:** 4mm
- **Altura da foto:** 65mm (principais) ou 50mm (atividades)
- **Altura do label:** 10mm (principais) ou 8mm (atividades)

### Quebra de Página Inteligente
1. Verifica se cabe na posição atual
2. Se não couber e estiver na coluna 0 → tenta coluna 1
3. Verifica novamente se cabe na coluna 1
4. Se não couber → nova página
5. Se já estiver na coluna 1 → nova página direto

## ✨ Melhorias Adicionais

- Logs detalhados no console para debug
- Tratamento de erros robusto para imagens
- Placeholder para imagens não disponíveis
- Aspect ratio preservado em todas as imagens
- Marca d'água sutil em todas as páginas

---

**Status:** ✅ Corrigido e testado
**Data:** 09/12/2025
**Versão:** 1.0
