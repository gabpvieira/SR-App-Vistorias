# Correção: Logo não Aparece Após Deploy

## Problema Identificado

Após o deploy na Vercel, o logotipo não estava aparecendo em nenhuma página:
- Landing Page
- Login
- Dashboard (Header)

## Causa Raiz

Os componentes estavam referenciando o logo com o caminho `/midia/logo SR.png`, mas:

1. **No Vite**: Apenas arquivos dentro da pasta `public/` são servidos estaticamente
2. **Pasta midia**: Estava na raiz do projeto, não dentro de `public/`
3. **Resultado**: O servidor não conseguia encontrar o arquivo

## Estrutura de Pastas

### Antes (Incorreto)
```
projeto/
├── midia/
│   └── logo SR.png          ❌ Não acessível pelo servidor
├── public/
│   └── logo SR.png          ✅ Acessível mas não usado
└── src/
    └── components/
        └── Logo.tsx         → src="/midia/logo SR.png" ❌
```

### Depois (Correto)
```
projeto/
├── midia/                   (mantida para backup)
├── public/
│   └── logo SR.png          ✅ Acessível e usado
└── src/
    └── components/
        └── Logo.tsx         → src="/logo SR.png" ✅
```

## Correções Aplicadas

### 1. Login Page
**Arquivo**: `src/pages/Login.tsx`

```typescript
// Antes
<img src="/midia/logo SR.png" alt="SR Caminhões" />

// Depois
<img src="/logo SR.png" alt="SR Caminhões" />
```

### 2. Landing Page
**Arquivo**: `src/pages/Landing.tsx`

```typescript
// Antes
<img src="/midia/logo SR.png" alt="SR Caminhões" />

// Depois
<img src="/logo SR.png" alt="SR Caminhões" />
```

### 3. Componente Logo (usado no Header)
**Arquivo**: `src/components/Logo.tsx`

```typescript
// Antes
<img src="/midia/logo SR.png" alt="SR Caminhões Logo" />

// Depois
<img src="/logo SR.png" alt="SR Caminhões Logo" />
```

## Como Funciona no Vite

### Pasta `public/`
- Arquivos servidos na raiz do site
- Acessíveis via `/nome-do-arquivo.ext`
- Não processados pelo Vite
- Ideais para assets estáticos como logos, favicons, etc.

### Exemplo
```
public/logo.png  →  Acessível em: https://site.com/logo.png
```

## Arquivos de Logo Disponíveis

Todos os logos estão em `public/`:

1. **logo SR.png** - Logo principal (usado)
2. **LOGO TRANSPARENTE SR [BRANCO].png** - Versão branca
3. **LOGO TRANSPARENTE SR [PRETO].png** - Versão preta
4. **LOGO APP ICON.png** - Ícone do app
5. **icon-192.png** - Ícone PWA 192x192
6. **icon-512.png** - Ícone PWA 512x512
7. **favicon.png** - Favicon

## Verificação

Para verificar se o logo está acessível após deploy:

1. **Local**: `http://localhost:5173/logo SR.png`
2. **Produção**: `https://seu-dominio.vercel.app/logo SR.png`

Se o arquivo abrir diretamente, está configurado corretamente.

## Arquivos Modificados

- `src/pages/Login.tsx`: Corrigido caminho do logo
- `src/pages/Landing.tsx`: Corrigido caminho do logo
- `src/components/Logo.tsx`: Corrigido caminho do logo

## Resultado

✅ Logo aparece na Landing Page
✅ Logo aparece na página de Login
✅ Logo aparece no Header do Dashboard
✅ Funciona em desenvolvimento e produção
✅ Compatível com Vercel e outros hosts

## Nota sobre a Pasta `midia/`

A pasta `midia/` na raiz foi mantida como backup, mas não é usada pelo sistema. Todos os assets estáticos devem estar em `public/` para serem acessíveis após o deploy.
