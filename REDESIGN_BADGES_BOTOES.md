# 🎨 Redesign - Badges e Botões Flat Design

## Data: 09/12/2025

---

## 🎯 Objetivo

Uniformizar o design dos badges e botões na página de detalhes da vistoria, criando um visual flat, compacto e consistente.

---

## ✨ Melhorias Implementadas

### 1. Design Flat Uniforme

#### Características:
- **Altura fixa:** 36px (h-9) para todos
- **Padding horizontal:** 16px (px-4)
- **Border radius:** 6px (rounded-md)
- **Font:** Semibold, 14px (text-sm)
- **Transições:** 200ms suaves

#### Visual:
```
┌─────────┐ ┌─────────┐ ┌─────────┐
│  Troca  │ │   PDF   │ │ Deletar │
└─────────┘ └─────────┘ └─────────┘
   36px       36px        36px
```

---

### 2. Badge Tipo de Vistoria

#### Antes:
- Componente separado (InspectionTypeBadge)
- Tamanho inconsistente
- Estilo diferente dos botões

#### Depois:
- Integrado diretamente
- Mesmo tamanho dos botões
- Visual uniforme

#### Cores:
- **Troca:** `bg-red-600` → `hover:bg-red-700`
- **Manutenção:** `bg-amber-500` → `hover:bg-amber-600`

#### Código:
```tsx
<div className={`
  inline-flex items-center justify-center
  h-9 px-4 rounded-md
  font-semibold text-sm
  transition-all duration-200
  ${inspection.type === 'troca' 
    ? 'bg-red-600 text-white hover:bg-red-700' 
    : 'bg-amber-500 text-white hover:bg-amber-600'
  }
`}>
  {inspection.type === 'troca' ? 'Troca' : 'Manutenção'}
</div>
```

---

### 3. Botão PDF

#### Características:
- **Cor:** Vermelho SR (`bg-red-600`)
- **Ícone:** FileDown (4x4)
- **Estados:**
  - Normal: Vermelho com hover
  - Gerando: Spinner animado
  - Desabilitado: Cinza

#### Efeitos:
- `hover:bg-red-700` - Escurece
- `hover:shadow-md` - Adiciona sombra
- `active:scale-95` - Efeito de clique

#### Código:
```tsx
<button
  onClick={handleDownloadPDF}
  disabled={isGeneratingPDF || photos.length === 0}
  className={`
    inline-flex items-center justify-center
    h-9 px-4 rounded-md
    font-semibold text-sm
    transition-all duration-200
    ${isGeneratingPDF || photos.length === 0
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-95'
    }
  `}
>
  {isGeneratingPDF ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Gerando...
    </>
  ) : (
    <>
      <FileDown className="h-4 w-4 mr-2" />
      PDF
    </>
  )}
</button>
```

---

### 4. Botão Deletar (Gerente)

#### Características:
- **Cor:** Vermelho SR (`bg-red-600`)
- **Ícone:** Trash2 (4x4)
- **Visibilidade:** Apenas para gerentes
- **Modal:** AlertDialog para confirmação

#### Efeitos:
- Mesmos efeitos do botão PDF
- Consistência visual total

#### Código:
```tsx
{user?.role === 'gerente' && (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button
        disabled={isDeleting}
        className={`
          inline-flex items-center justify-center
          h-9 px-4 rounded-md
          font-semibold text-sm
          transition-all duration-200
          ${isDeleting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-95'
          }
        `}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Deletar
      </button>
    </AlertDialogTrigger>
    {/* ... AlertDialog content ... */}
  </AlertDialog>
)}
```

---

## 🎨 Paleta de Cores

### Vermelho SR (Padrão):
```css
Normal:      bg-red-600  (#DC2626)
Hover:       bg-red-700  (#B91C1C)
Text:        text-white  (#FFFFFF)
```

### Amarelo (Manutenção):
```css
Normal:      bg-amber-500  (#F59E0B)
Hover:       bg-amber-600  (#D97706)
Text:        text-white    (#FFFFFF)
```

### Desabilitado:
```css
Background:  bg-gray-300  (#D1D5DB)
Text:        text-gray-500 (#6B7280)
Cursor:      cursor-not-allowed
```

---

## 📏 Especificações Técnicas

### Dimensões:
- **Altura:** 36px (h-9)
- **Padding horizontal:** 16px (px-4)
- **Border radius:** 6px (rounded-md)
- **Gap entre elementos:** 8px (gap-2)

### Tipografia:
- **Font weight:** Semibold (600)
- **Font size:** 14px (text-sm)
- **Line height:** Auto

### Ícones:
- **Tamanho:** 16px (h-4 w-4)
- **Margin right:** 8px (mr-2)
- **Alinhamento:** Vertical center

### Transições:
- **Duração:** 200ms
- **Propriedades:** all
- **Easing:** ease (padrão)

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Altura** | Variável | 36px uniforme |
| **Estilo** | Misto (badge + button) | Flat uniforme |
| **Cores** | Azul/Amarelo | Vermelho SR/Amarelo |
| **Espaçamento** | gap-3 (12px) | gap-2 (8px) |
| **Hover** | Básico | Shadow + Scale |
| **Consistência** | Baixa | Alta |
| **Visual** | Padrão | Premium flat |

---

## 🎯 Estados dos Botões

### 1. Normal
```css
bg-red-600 text-white
hover:bg-red-700 hover:shadow-md
active:scale-95
```

### 2. Hover
```css
bg-red-700 (escurece)
shadow-md (elevação)
cursor-pointer
```

### 3. Active (Clique)
```css
scale-95 (reduz 5%)
Feedback tátil
```

### 4. Disabled
```css
bg-gray-300 text-gray-500
cursor-not-allowed
opacity reduzida
```

### 5. Loading (PDF)
```css
Spinner animado
Texto "Gerando..."
Desabilitado
```

---

## 📱 Responsividade

### Desktop:
```tsx
<div className="flex items-center gap-2">
  [Badge] [PDF] [Deletar]
</div>
```

### Mobile:
- Mesma estrutura
- Pode quebrar linha se necessário
- Mantém alinhamento

---

## ✅ Benefícios

### Visual:
- ✅ Design flat moderno
- ✅ Uniformidade total
- ✅ Identidade SR (vermelho)
- ✅ Compacto e limpo

### UX:
- ✅ Feedback visual claro
- ✅ Estados bem definidos
- ✅ Transições suaves
- ✅ Hierarquia clara

### Técnico:
- ✅ Código mais limpo
- ✅ Menos componentes
- ✅ Manutenção fácil
- ✅ Performance otimizada

---

## 🧪 Testes Recomendados

- [ ] Visualizar em desktop
- [ ] Visualizar em mobile
- [ ] Testar hover effects
- [ ] Testar clique (active state)
- [ ] Testar botão PDF desabilitado
- [ ] Testar botão PDF gerando
- [ ] Testar botão deletar (gerente)
- [ ] Verificar badge Troca
- [ ] Verificar badge Manutenção
- [ ] Testar em tema dark/light

---

## 💡 Observações

### Removido:
- ❌ Componente `InspectionTypeBadge`
- ❌ Componente `Button` do shadcn
- ❌ Variantes inconsistentes

### Adicionado:
- ✅ Badges inline com Tailwind
- ✅ Botões nativos estilizados
- ✅ Efeitos de hover/active
- ✅ Estados visuais claros

### Mantido:
- ✅ AlertDialog para deletar
- ✅ Lógica de permissões
- ✅ Estados de loading
- ✅ Funcionalidades

---

## 🎨 Exemplo Visual

```
┌─────────────────────────────────────────────────┐
│ Vistoria #3ec86d4a                              │
│ RSF-3F35                                        │
│                                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│ │  Troca  │ │   PDF   │ │ Deletar │           │
│ └─────────┘ └─────────┘ └─────────┘           │
│   Vermelho    Vermelho    Vermelho             │
│   36px        36px        36px                 │
└─────────────────────────────────────────────────┘
```

---

**Status:** ✅ Implementado  
**Testado:** Pendente teste visual  
**Deploy:** Pendente
