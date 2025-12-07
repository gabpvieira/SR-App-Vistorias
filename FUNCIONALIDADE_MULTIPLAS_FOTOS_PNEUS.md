# Funcionalidade: Múltiplas Fotos na Etapa de Pneus

## Objetivo

Permitir que o usuário adicione múltiplas fotos (mínimo 4, máximo 10) na etapa "Detalhe dos pneus" das vistorias guiadas de Rodotrem Basculante e Rodotrem Graneleiro.

## Implementação

### Detecção Automática

O sistema detecta automaticamente etapas que requerem múltiplas fotos através do label:

```typescript
const isMultiplePhotosStep = currentStep?.label?.toLowerCase().includes('pneus') || 
                              currentStep?.label?.toLowerCase().includes('minimo');
```

### Estrutura de Dados

**Arquivo**: `src/pages/GuidedInspection.tsx`

Adicionado novo estado para gerenciar múltiplas fotos:

```typescript
interface MultiplePhotosStep {
  stepId: string;
  photos: CapturedPhoto[];
}

const [multiplePhotos, setMultiplePhotos] = useState<Map<string, CapturedPhoto[]>>(new Map());
```

### Validação

- **Mínimo**: 4 fotos obrigatórias
- **Máximo**: 10 fotos por etapa
- **Feedback**: Mensagens claras sobre quantas fotos foram adicionadas

### Interface do Usuário

#### Grid de Fotos
- Exibe todas as fotos em grid 2 colunas
- Formato 4:3 para cada foto
- Preview imediato após captura

#### Botões Dinâmicos
- **"Tirar Foto"** → **"Tirar Mais"** (após primeira foto)
- **"Galeria"** → **"Adicionar Mais"** (após primeira foto)
- Botões desabilitados ao atingir limite de 10 fotos

#### Indicadores
- Contador de fotos: "X foto(s) adicionada(s)"
- Aviso de mínimo: "Mínimo: 4 fotos" (quando < 4)
- Aviso de limite: "Limite atingido" (quando = 10)

### Fluxo de Uso

1. **Usuário chega na etapa de pneus**
   - Vê placeholder com informação: "Mínimo: 4 fotos | Máximo: 10 fotos"

2. **Adiciona primeira foto**
   - Foto aparece no grid
   - Contador mostra: "1 foto(s) adicionada(s) - Mínimo: 4 fotos"
   - Botões mudam para "Tirar Mais" e "Adicionar Mais"

3. **Adiciona mais fotos**
   - Grid expande mostrando todas as fotos
   - Contador atualiza em tempo real

4. **Tenta avançar com menos de 4 fotos**
   - Sistema bloqueia e exibe toast: "Adicione pelo menos 4 fotos antes de continuar"

5. **Adiciona 4+ fotos**
   - Botão "Próxima Etapa" ou "Finalizar" fica habilitado
   - Pode continuar adicionando até 10 fotos

6. **Atinge 10 fotos**
   - Botões de captura desabilitados
   - Mensagem: "Limite atingido"

### Upload das Fotos

Ao finalizar a vistoria, todas as fotos são enviadas com labels únicos:

```typescript
// Exemplo de labels gerados:
"Detalhe dos pneus minimo 4 fotos - Foto 1"
"Detalhe dos pneus minimo 4 fotos - Foto 2"
"Detalhe dos pneus minimo 4 fotos - Foto 3"
"Detalhe dos pneus minimo 4 fotos - Foto 4"
```

### Validação na Finalização

```typescript
const missingSteps = steps.filter(step => {
  const hasMultiplePhotos = multiplePhotos.has(step.id) && 
                            multiplePhotos.get(step.id)!.length >= 4;
  const hasSinglePhoto = photos.has(step.id);
  return !hasMultiplePhotos && !hasSinglePhoto;
});
```

## Benefícios

1. **Documentação Completa**
   - Permite capturar todos os pneus do veículo
   - Melhor evidência do estado dos pneus

2. **Flexibilidade**
   - Usuário pode adicionar quantas fotos precisar (até 10)
   - Não precisa decidir antecipadamente quantas fotos tirar

3. **Experiência Intuitiva**
   - Feedback visual claro
   - Botões adaptativos
   - Validação em tempo real

4. **Qualidade**
   - Todas as fotos recebem marca d'água
   - Mantém rastreabilidade completa

## Etapas Afetadas

### Rodotrem Basculante
- Etapa 6: "Detalhe dos pneus minimo 4 fotos"

### Rodotrem Graneleiro
- Etapa 6: "Detalhe dos pneus minimo 4 fotos"

## Compatibilidade

- ✅ Funciona em todas as etapas que contenham "pneus" ou "minimo" no label
- ✅ Não afeta etapas de foto única
- ✅ Compatível com câmera e galeria
- ✅ Marca d'água aplicada em todas as fotos

## Otimizações Implementadas

### 1. Botão de Remoção
- Cada foto tem um botão X no canto superior direito
- Permite remover fotos individualmente
- Libera memória revogando URLs de preview
- Atualiza contador em tempo real

### 2. Validação Correta do Botão "Próxima Etapa"
- Botão habilitado quando tem 4+ fotos (etapas múltiplas)
- Botão habilitado quando tem 1 foto (etapas únicas)
- Usa variável `hasPhotos` que verifica ambos os casos

### 3. Feedback Visual
- Toast ao remover foto: "Foto removida - X foto(s) restante(s)"
- Contador atualiza automaticamente
- Botões de captura reabilitados se estava no limite

## Arquivos Modificados

- `src/pages/GuidedInspection.tsx`: Implementação completa da funcionalidade

## Exemplo Visual

```
┌─────────────────────────────────────┐
│  Detalhe dos pneus minimo 4 fotos   │
│  Tire fotos detalhadas de pelo      │
│  menos 4 pneus diferentes.          │
├─────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐          │
│  │ Foto 1 ❌│  │ Foto 2 ❌│          │
│  └─────────┘  └─────────┘          │
│  ┌─────────┐  ┌─────────┐          │
│  │ Foto 3 ❌│  │ Foto 4 ❌│          │
│  └─────────┘  └─────────┘          │
├─────────────────────────────────────┤
│  ℹ️ 4 foto(s) adicionada(s)         │
├─────────────────────────────────────┤
│  [📷 Tirar Mais] [📁 Adicionar Mais]│
│                                     │
│  [← Voltar]     [Próxima Etapa →]  │
└─────────────────────────────────────┘
```

**Nota**: Cada foto tem um botão ❌ no canto superior direito para remoção individual.
