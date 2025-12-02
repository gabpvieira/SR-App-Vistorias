# 📸 Funcionalidade: Marca d'Água com Timestamp e Localização

## ✅ Implementado

### 🎯 Objetivo
Adicionar marca d'água automática nas fotos capturadas pela câmera, incluindo:
- Data e hora precisa
- Localização (cidade, estado)
- Coordenadas GPS
- Design similar ao app Timestamp Camera

---

## 🎨 Aparência da Marca d'Água

### Posição
- **Localização**: Canto superior direito
- **Fundo**: Preto semi-transparente (70% opacidade)
- **Borda**: Branca semi-transparente (30% opacidade)
- **Texto**: Branco, negrito

### Conteúdo
```
┌─────────────────────────────┐
│ 02/12/2025 19:30:45        │
│ São Paulo, SP              │
│ 23.550520°S 46.633308°O    │
└─────────────────────────────┘
```

### Exemplo Visual
```
┌────────────────────────────────────────────────────────┐
│                    ┌─────────────────────────────┐     │
│                    │ 02/12/2025 19:30:45        │     │
│                    │ São Paulo, SP              │     │
│                    │ 23.550520°S 46.633308°O    │     │
│                    └─────────────────────────────┘     │
│                                                        │
│                                                        │
│                    [Foto do Veículo]                   │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔧 Arquitetura da Solução

### 1. Serviço de Marca d'Água (`watermark-service.ts`)

#### Funções Principais

**`getLocation(): Promise<LocationData | null>`**
- Solicita permissão de geolocalização
- Obtém coordenadas GPS precisas
- Usa `enableHighAccuracy: true`
- Timeout de 10 segundos

**`reverseGeocode(lat, lon): Promise<Partial<LocationData>>`**
- Converte coordenadas em endereço
- Usa API Nominatim (OpenStreetMap)
- Retorna cidade, estado, país
- Gratuito e sem necessidade de API key

**`addWatermarkToImage(file, watermarkData): Promise<Blob>`**
- Cria canvas com dimensões da imagem
- Desenha imagem original
- Adiciona caixa de texto no canto superior direito
- Calcula tamanho da fonte baseado na largura da imagem
- Retorna blob da imagem processada

**`processPhotoWithWatermark(file): Promise<File>`**
- Função completa que:
  1. Obtém localização
  2. Prepara dados da marca d'água
  3. Adiciona marca d'água na imagem
  4. Retorna novo arquivo

#### Tipos TypeScript

```typescript
interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  accuracy?: number;
}

interface WatermarkData {
  timestamp: Date;
  location?: LocationData;
  formattedText: string[];
}
```

---

### 2. Hook React (`use-watermark.ts`)

#### Funcionalidades

```typescript
const {
  isLocationEnabled,      // Se localização está habilitada
  currentLocation,        // Dados da localização atual
  isLoadingLocation,      // Se está carregando localização
  locationError,          // Erro de localização (se houver)
  isGeolocationSupported, // Se navegador suporta geolocalização
  requestPermission,      // Solicita permissão de localização
  refreshLocation,        // Atualiza localização
  addWatermark,          // Adiciona marca d'água em arquivo
  processPhoto,          // Processa foto completa
} = useWatermark({ autoRequestPermission: true });
```

#### Opções

```typescript
interface UseWatermarkOptions {
  autoRequestPermission?: boolean; // Solicita permissão automaticamente
}
```

---

### 3. Componente de Câmera (`CameraWithWatermark.tsx`)

#### Props

```typescript
interface CameraWithWatermarkProps {
  onPhotoCapture: (file: File) => void;
  onCancel?: () => void;
}
```

#### Funcionalidades

- ✅ Solicita permissão de localização ao montar
- ✅ Exibe status da localização (cidade, coordenadas)
- ✅ Botão para tentar novamente se falhar
- ✅ Captura foto com câmera do dispositivo
- ✅ Adiciona marca d'água automaticamente
- ✅ Preview da foto com marca d'água
- ✅ Opções de confirmar ou descartar
- ✅ Feedback visual durante processamento

#### Estados da Interface

**1. Carregando Localização**
```
┌─────────────────────────────┐
│ 📍 Localização              │
│ ⏳ Obtendo localização...   │
└─────────────────────────────┘
```

**2. Localização Obtida**
```
┌─────────────────────────────┐
│ 📍 Localização              │
│ 📍 São Paulo, SP            │
│ -23.550520°, -46.633308°    │
└─────────────────────────────┘
```

**3. Erro de Localização**
```
┌─────────────────────────────┐
│ 📍 Localização              │
│ ⚠️ Permissão negada         │
│ [Tentar Novamente]          │
└─────────────────────────────┘
```

---

### 4. Modal de Câmera (`WatermarkCameraModal.tsx`)

#### Props

```typescript
interface WatermarkCameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCapture: (file: File) => void;
  title?: string;
  description?: string;
}
```

#### Uso

```tsx
<WatermarkCameraModal
  open={showModal}
  onOpenChange={setShowModal}
  onPhotoCapture={handlePhotoCapture}
  title="Frente do Veículo"
  description="Tire uma foto da frente completa do veículo"
/>
```

---

## 🔄 Fluxo de Funcionamento

### 1. Usuário Inicia Vistoria Guiada
```
1. Página carrega
2. Hook solicita permissão de localização
3. Navegador exibe popup de permissão
4. Usuário permite ou nega
```

### 2. Usuário Clica em "Tirar Foto"
```
1. Modal de câmera abre
2. Exibe status da localização
3. Botão "Tirar Foto" disponível
```

### 3. Captura da Foto
```
1. Usuário clica em "Tirar Foto"
2. Câmera do dispositivo abre
3. Usuário tira a foto
4. Sistema processa:
   a. Obtém localização atual (ou usa cache)
   b. Formata data/hora
   c. Cria canvas
   d. Desenha imagem original
   e. Adiciona marca d'água
   f. Converte para blob
5. Exibe preview da foto com marca d'água
```

### 4. Confirmação
```
1. Usuário vê preview
2. Opções:
   - Confirmar: Adiciona foto à vistoria
   - Descartar: Remove e permite tirar nova foto
```

---

## 🎨 Detalhes Técnicos da Marca d'Água

### Cálculo do Tamanho da Fonte
```typescript
const fontSize = Math.max(Math.floor(img.width / 40), 14);
```
- Proporcional à largura da imagem
- Mínimo de 14px
- Exemplo: Imagem 1920px → fonte 48px

### Posicionamento
```typescript
const x = img.width - boxWidth - padding;
const y = padding;
```
- Canto superior direito
- Padding de 80% do tamanho da fonte

### Espaçamento entre Linhas
```typescript
const lineHeight = Math.floor(fontSize * 1.4);
```
- 140% do tamanho da fonte
- Garante legibilidade

### Cores e Opacidade
```typescript
// Fundo
ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Preto 70%

// Borda
ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // Branco 30%

// Texto
ctx.fillStyle = '#FFFFFF'; // Branco 100%
```

---

## 📱 Permissões Necessárias

### Geolocalização
```javascript
navigator.geolocation.getCurrentPosition(
  success,
  error,
  {
    enableHighAccuracy: true, // GPS preciso
    timeout: 10000,           // 10 segundos
    maximumAge: 0,            // Sem cache
  }
);
```

### Câmera
```html
<input
  type="file"
  accept="image/*"
  capture="environment" <!-- Câmera traseira -->
/>
```

---

## 🌐 API de Geocoding

### Nominatim (OpenStreetMap)

**Endpoint:**
```
https://nominatim.openstreetmap.org/reverse
```

**Parâmetros:**
- `format=json`
- `lat={latitude}`
- `lon={longitude}`
- `zoom=18` (nível de detalhe)
- `addressdetails=1` (incluir detalhes)

**Resposta:**
```json
{
  "address": {
    "city": "São Paulo",
    "state": "São Paulo",
    "country": "Brasil",
    "municipality": "São Paulo"
  },
  "display_name": "Rua Exemplo, 123, São Paulo, SP, Brasil"
}
```

**Vantagens:**
- ✅ Gratuito
- ✅ Sem necessidade de API key
- ✅ Sem limite de requisições (uso razoável)
- ✅ Dados do OpenStreetMap

**Limitações:**
- ⚠️ Requer User-Agent
- ⚠️ Não usar para aplicações de alto volume
- ⚠️ Pode ser lento em alguns casos

---

## 🧪 Como Testar

### 1. Testar Permissão de Localização

**Desktop:**
1. Abra DevTools (F12)
2. Vá em "Sensors" ou "Location"
3. Selecione uma localização customizada
4. Ou use "São Paulo, Brazil"

**Mobile:**
1. Permita localização quando solicitado
2. Verifique se GPS está ativado
3. Aguarde alguns segundos para precisão

### 2. Testar Marca d'Água

1. Acesse vistoria guiada
2. Clique em "Tirar Foto"
3. Permita localização
4. Tire uma foto
5. Verifique se marca d'água aparece no canto superior direito
6. Confirme que contém:
   - Data e hora corretas
   - Cidade e estado (se disponível)
   - Coordenadas GPS

### 3. Testar Sem Localização

1. Negue permissão de localização
2. Tire uma foto
3. Marca d'água deve mostrar:
   - Data e hora
   - "Localização não disponível"

### 4. Testar Diferentes Resoluções

- Foto pequena (640x480)
- Foto média (1280x720)
- Foto grande (1920x1080)
- Foto muito grande (4000x3000)

Verifique se:
- Fonte escala proporcionalmente
- Marca d'água permanece legível
- Posicionamento está correto

---

## 📊 Exemplo de Dados

### LocationData Completo
```typescript
{
  latitude: -23.550520,
  longitude: -46.633308,
  city: "São Paulo",
  state: "São Paulo",
  country: "Brasil",
  address: "Av. Paulista, 1578, São Paulo, SP, Brasil",
  accuracy: 10 // metros
}
```

### WatermarkData
```typescript
{
  timestamp: new Date("2025-12-02T19:30:45"),
  location: { /* LocationData */ },
  formattedText: [
    "02/12/2025 19:30:45",
    "São Paulo, SP",
    "23.550520°S 46.633308°O"
  ]
}
```

---

## 🔒 Privacidade e Segurança

### Dados de Localização
- ✅ Solicitado apenas quando necessário
- ✅ Usuário pode negar permissão
- ✅ Não armazenado em servidor (apenas na foto)
- ✅ Precisão configurável

### Fotos
- ✅ Processadas localmente no navegador
- ✅ Não enviadas para serviços externos
- ✅ Marca d'água permanente (não removível)
- ✅ Upload apenas após confirmação do usuário

---

## 📝 Arquivos Criados

1. `src/lib/watermark-service.ts` - Serviço principal
2. `src/hooks/use-watermark.ts` - Hook React
3. `src/components/CameraWithWatermark.tsx` - Componente de câmera
4. `src/components/WatermarkCameraModal.tsx` - Modal
5. `src/pages/GuidedInspection.tsx` - Integração (atualizado)

---

## 🚀 Próximas Melhorias (Opcional)

- [ ] Adicionar logo da empresa na marca d'água
- [ ] Permitir customizar posição da marca d'água
- [ ] Adicionar nome do vendedor
- [ ] Adicionar placa do veículo
- [ ] Salvar dados de localização no banco
- [ ] Histórico de localizações
- [ ] Modo offline (usar última localização conhecida)
- [ ] Compressão de imagem antes de adicionar marca d'água
- [ ] Suporte a múltiplas fotos em lote

---

## ✅ Checklist de Funcionalidades

### Geolocalização
- [x] Solicitar permissão
- [x] Obter coordenadas GPS
- [x] Geocoding reverso (coordenadas → endereço)
- [x] Tratamento de erros
- [x] Feedback visual de status
- [x] Botão para tentar novamente

### Marca d'Água
- [x] Data e hora formatada
- [x] Cidade e estado
- [x] Coordenadas GPS
- [x] Posicionamento no canto superior direito
- [x] Fundo semi-transparente
- [x] Texto legível
- [x] Tamanho proporcional à imagem

### Interface
- [x] Modal de câmera
- [x] Preview da foto
- [x] Opções de confirmar/descartar
- [x] Feedback de processamento
- [x] Mensagens de erro
- [x] Design responsivo

### Integração
- [x] Vistoria guiada
- [x] Hook reutilizável
- [x] Componentes modulares
- [x] TypeScript completo
- [x] Sem erros de diagnóstico

---

## 🎉 Conclusão

A funcionalidade de marca d'água está completa e pronta para uso! As fotos capturadas pela câmera terão automaticamente:
- ✅ Data e hora precisa
- ✅ Localização (cidade, estado)
- ✅ Coordenadas GPS
- ✅ Design profissional e legível

Similar ao app Timestamp Camera, mas integrado diretamente no sistema de vistorias.
