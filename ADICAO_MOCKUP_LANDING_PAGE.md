# Adição: Mockup na Landing Page

## Implementação

Adicionada a imagem `MOCKUP-LP.png` na Landing Page para melhorar a apresentação visual do sistema.

## Localização

**Arquivo**: `src/pages/Landing.tsx`

A imagem foi posicionada no lado direito da página (desktop), substituindo o card placeholder anterior.

## Características

### Posicionamento
- **Desktop (lg+)**: Lado direito, ocupando metade da tela
- **Mobile/Tablet**: Oculto (hidden lg:block)
- **Responsivo**: Adapta-se ao tamanho da tela

### Efeitos Visuais
1. **Elementos Decorativos**
   - Gradientes sutis com blur
   - Rotação leve (3° e -3°)
   - Escala aumentada (105%)

2. **Imagem**
   - Drop shadow 2xl para profundidade
   - Animação de fade-in suave
   - Object-contain para manter proporções

### Código Implementado

```tsx
<div className="hidden lg:block relative">
  <div className="relative w-full">
    {/* Decorative elements */}
    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 to-slate-600/5 dark:from-white/5 dark:to-slate-400/5 rounded-3xl rotate-3 scale-105 blur-xl"></div>
    <div className="absolute inset-0 bg-gradient-to-tr from-slate-600/5 to-slate-900/5 dark:from-slate-400/5 dark:to-white/5 rounded-3xl -rotate-3 scale-105 blur-xl"></div>
    
    {/* Mockup Image */}
    <div className="relative">
      <img 
        src="/MOCKUP-LP.png" 
        alt="SR Caminhões - Sistema de Vistorias" 
        className="w-full h-auto object-contain drop-shadow-2xl animate-fade-in"
      />
    </div>
  </div>
</div>
```

## Layout da Landing Page

```
┌─────────────────────────────────────────────────────┐
│                    [Header]                         │
│                                  [Fazer Login]      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌──────────────────┐       │
│  │                  │  │                  │       │
│  │  Logo SR         │  │                  │       │
│  │                  │  │   MOCKUP-LP.png  │       │
│  │  Título          │  │                  │       │
│  │  Descrição       │  │   (Imagem do     │       │
│  │                  │  │    Sistema)      │       │
│  │  [Acessar]       │  │                  │       │
│  │                  │  │                  │       │
│  │  Features Cards  │  │                  │       │
│  │                  │  │                  │       │
│  └──────────────────┘  └──────────────────┘       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Footer]                         │
└─────────────────────────────────────────────────────┘
```

## Benefícios

1. **Visual Profissional**
   - Mostra o sistema real em uso
   - Aumenta credibilidade

2. **Melhor Apresentação**
   - Substitui placeholder genérico
   - Demonstra interface real

3. **Experiência do Usuário**
   - Usuários veem o que esperar
   - Reduz incerteza

4. **Responsivo**
   - Oculto em mobile para não sobrecarregar
   - Visível apenas em telas grandes

## Arquivo de Imagem

**Localização**: `public/MOCKUP-LP.png`

**Acesso**: `/MOCKUP-LP.png` (servido estaticamente pelo Vite)

## Compatibilidade

- ✅ Desktop (lg e acima)
- ✅ Dark mode (gradientes adaptativos)
- ✅ Animações suaves
- ✅ Performance otimizada

## Arquivos Modificados

- `src/pages/Landing.tsx`: Adicionado mockup no lado direito

## Resultado

A Landing Page agora apresenta uma imagem real do sistema, tornando a página mais atrativa e profissional, especialmente para novos usuários que acessam pela primeira vez.
