# Sistema de Otimização de Imagens

## Visão Geral

Sistema completo de otimização e aceleração de carregamento de imagens implementado para reduzir drasticamente o tempo de carregamento (de 10+ segundos para menos de 2-3 segundos).

**Data de Implementação:** 10 de Dezembro de 2025

## Funcionalidades Implementadas

### 1. Compressão Automática

- **WebP como formato prioritário** com fallback para JPEG
- **Detecção automática** de suporte a WebP/AVIF
- **Compressão inteligente** mantendo qualidade visual
- **Redimensionamento automático** baseado no dispositivo

```typescript
import { compressForUpload, optimizeImage } from '@/lib/image';

// Compressão simples com LQIP
const { file, lqip } = await compressForUpload(originalFile, {
  maxWidth: 1920,
  quality: 0.8,
  format: 'webp'
});

// Otimização avançada
const result = await optimizeImage(file, {
  maxWidth: 1200,
  quality: 0.8,
  generateLQIP: true
});
```

### 2. Lazy Loading Inteligente

- **Intersection Observer** para carregamento sob demanda
- **Lazy loading nativo** (`loading="lazy"`) como fallback
- **Preload de imagens críticas** (logos, hero banners)

```tsx
import { OptimizedImage, LazyImage } from '@/lib/image';

// Imagem otimizada completa
<OptimizedImage
  src={imageUrl}
  alt="Descrição"
  layout="half"
  quality={75}
  showSkeleton={true}
/>

// Versão leve para listas
<LazyImage
  src={imageUrl}
  alt="Descrição"
  optimizedWidth={400}
  aspectRatio="4/3"
/>
```

### 3. Placeholders LQIP (Low Quality Image Placeholder)

- **Blur placeholder** durante carregamento
- **Skeleton loading** animado
- **Transição suave** (fade-in)

```tsx
<OptimizedImage
  src={imageUrl}
  alt="Foto"
  placeholder={lqipBase64}
  fadeDuration={300}
/>
```

### 4. Cache Inteligente

#### Service Worker (sw.js v7)
- **Cache separado para imagens** (`sr-vistorias-images-v7`)
- **Stale-while-revalidate** para imagens
- **Precache de imagens críticas** (logos, ícones, exemplos)
- **Limite de 100 itens** no cache de imagens
- **Limpeza automática** de cache antigo

#### Headers HTTP (vercel.json)
- **Cache-Control: max-age=31536000, immutable** para imagens estáticas
- **Vary: Accept** para negociação de formato
- **Cache específico** para diferentes tipos de assets

### 5. Srcset Responsivo

- **Breakpoints automáticos**: 320, 480, 640, 768, 1024, 1280, 1536, 1920px
- **Cálculo de DPR** (Device Pixel Ratio)
- **Sizes attribute** baseado no layout

```tsx
<OptimizedImage
  src={imageUrl}
  alt="Foto"
  layout="third" // (max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw
/>
```

### 6. Integração com Supabase Storage

- **Transformação de imagens** via API do Supabase
- **Thumbnails otimizados** com parâmetros de qualidade
- **Srcset automático** para URLs do Supabase

```typescript
import { getSupabaseThumbnailUrl, getSupabaseSrcSet } from '@/lib/image';

// Thumbnail 400px, qualidade 60%
const thumbUrl = getSupabaseThumbnailUrl(originalUrl, 400, 60);

// Srcset completo
const srcSet = getSupabaseSrcSet(originalUrl);
```

## Componentes Disponíveis

### OptimizedImage
Componente completo com todas as otimizações.

```tsx
<OptimizedImage
  src={url}
  alt="Descrição"
  width={800}
  height={600}
  layout="full" | "half" | "third" | "quarter" | "thumbnail"
  quality={75}
  eager={false}
  priority={false}
  showSkeleton={true}
  fadeDuration={300}
  aspectRatio="16/9"
  objectFit="cover"
/>
```

### LazyImage
Versão leve para listas e grids.

```tsx
<LazyImage
  src={url}
  alt="Descrição"
  optimizedWidth={400}
  quality={70}
  aspectRatio="4/3"
/>
```

### Thumbnail
Para miniaturas em listas.

```tsx
<Thumbnail
  src={url}
  alt="Descrição"
  size={80}
  quality={60}
  onClick={() => openLightbox()}
/>
```

### OptimizedAvatar
Para avatares de usuários.

```tsx
<OptimizedAvatar
  src={avatarUrl}
  alt="Nome do Usuário"
  size="md" // sm | md | lg | xl
  fallback="JD"
/>
```

### PhotoGallery (Atualizado)
Galeria com thumbnails otimizados e lightbox.

```tsx
<PhotoGallery
  photos={photoUrls}
  columns={4}
  thumbnailQuality={60}
/>
```

## Hooks Disponíveis

### useOptimizedImage
Hook para controle granular do carregamento.

```tsx
const {
  currentSrc,
  srcSet,
  isLoading,
  hasError,
  isLoaded,
  ref,
  reload
} = useOptimizedImage({
  src: imageUrl,
  containerWidth: 400,
  lazy: true,
  quality: 75,
  retries: 2,
  onLoad: () => console.log('Carregou!'),
  onError: (err) => console.error(err)
});
```

### useImagePreloader
Para precarregar múltiplas imagens.

```tsx
const { loaded, failed, isComplete, progress } = useImagePreloader({
  urls: imageUrls,
  enabled: true,
  concurrency: 3
});
```

### useImageLazyList
Para carregamento progressivo de listas.

```tsx
const { visibleImages, hasMore, loadMore, loadAll } = useImageLazyList(
  allImages,
  { batchSize: 4, delay: 100 }
);
```

## Utilitários de Cache

```typescript
import {
  precacheImages,
  clearImageCache,
  isImageCached,
  getImageCacheSize,
  getImageLoadStats
} from '@/lib/image';

// Precachear imagens via Service Worker
precacheImages([url1, url2, url3]);

// Limpar cache de imagens
clearImageCache();

// Verificar se está em cache
const cached = await isImageCached(url);

// Tamanho do cache
const size = await getImageCacheSize();

// Estatísticas de carregamento
const stats = getImageLoadStats();
```

## Compatibilidade

- **Chrome 109+** (Windows 7)
- **Firefox 78+**
- **Safari 14+**
- **Edge 79+**

### Fallbacks Implementados
- WebP → JPEG para navegadores sem suporte
- Intersection Observer → loading="lazy" nativo
- PerformanceObserver → desabilitado silenciosamente

## Estrutura de Arquivos

```
src/
├── lib/
│   ├── image/
│   │   └── index.ts          # Exportações centralizadas
│   ├── image-utils.ts        # Utilitários básicos
│   ├── image-optimizer.ts    # Sistema avançado
│   └── image-cache-manager.ts # Gerenciamento de cache
├── hooks/
│   └── useOptimizedImage.ts  # Hooks React
├── components/
│   ├── OptimizedImage.tsx    # Componente principal
│   ├── LazyImage.tsx         # Componentes leves
│   └── PhotoGallery.tsx      # Galeria otimizada
public/
└── sw.js                     # Service Worker v7
vercel.json                   # Headers de cache
```

## Métricas de Performance

O sistema monitora automaticamente:
- Tempo de carregamento por imagem
- Taxa de cache hit
- Imagens mais lentas
- Tamanho total do cache

```typescript
const stats = getImageLoadStats();
// {
//   totalImages: 50,
//   averageLoadTime: 150, // ms
//   cachedPercentage: 85,
//   slowestImages: [...]
// }
```

## Resultado Esperado

| Métrica | Antes | Depois |
|---------|-------|--------|
| Tempo de carregamento | 10+ segundos | < 2-3 segundos |
| Tamanho médio | ~2MB | ~200KB |
| Cache hit rate | 0% | 80%+ |
| First Contentful Paint | Lento | Rápido (skeleton) |
