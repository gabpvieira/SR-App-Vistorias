# Design Document - Vistoria Guiada por Tipo de Veículo

## Overview

O sistema de Vistoria Guiada por Tipo de Veículo é uma funcionalidade que transforma o processo de captura de fotos em vistorias de troca em uma experiência estruturada e padronizada. Inspirado em aplicativos bancários de vistoria veicular, o sistema guia o vendedor através de etapas sequenciais, cada uma com instruções visuais e textuais específicas sobre qual foto tirar e de qual ângulo.

A funcionalidade se aplica exclusivamente a vistorias do tipo "Troca" e oferece cinco modelos pré-definidos baseados em tipos de veículos comuns (Cavalo 6x4, Cavalo 6x2, Carreta Rodotrem 9 Eixos, Carreta Rodotrem Graneleiro) além de um modo "Livre" para casos que não seguem padrões específicos.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ NewInspection│  │ GuidedFlow   │  │ InspectionDetail│   │
│  │    Page      │  │  Component   │  │     Page      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Inspection   │  │ Photo        │  │ Validation   │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Inspection   │  │ Photo        │  │ Supabase     │      │
│  │ Repository   │  │ Repository   │  │ Storage      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Criação de Vistoria**: Usuário seleciona tipo "Troca" → Sistema exibe campo "Modelo de Vistoria Guiada"
2. **Seleção de Modelo**: Usuário escolhe modelo → Sistema carrega sequência de etapas correspondente
3. **Fluxo Guiado**: Para cada etapa → Sistema exibe ilustração + instruções → Usuário captura foto → Sistema valida e permite avanço
4. **Armazenamento**: Foto capturada → Compressão (se necessário) → Upload para Supabase Storage → Registro de metadados
5. **Conclusão**: Todas etapas completas → Validação final → Salvamento da vistoria → Redirecionamento


## Components and Interfaces

### 1. VehicleModelSelector Component

**Purpose**: Permite seleção do modelo de vistoria guiada

**Props**:
```typescript
interface VehicleModelSelectorProps {
  value: VehicleModel | null;
  onChange: (model: VehicleModel) => void;
  disabled?: boolean;
}
```

**Behavior**:
- Exibe 5 opções em formato de cards ou dropdown
- Valida seleção obrigatória antes de permitir avanço
- Apenas visível quando tipo de vistoria é "Troca"

### 2. GuidedInspectionFlow Component

**Purpose**: Gerencia o fluxo completo de captura de fotos guiadas

**Props**:
```typescript
interface GuidedInspectionFlowProps {
  inspectionId: string;
  vehicleModel: VehicleModel;
  onComplete: (photos: InspectionPhoto[]) => void;
  onCancel: () => void;
}
```

**State**:
```typescript
interface GuidedFlowState {
  currentStepIndex: number;
  steps: InspectionStep[];
  capturedPhotos: Map<string, CapturedPhoto>;
  isUploading: boolean;
}
```

**Behavior**:
- Carrega sequência de etapas baseada no modelo
- Gerencia navegação entre etapas
- Mantém estado das fotos capturadas
- Valida completude antes de permitir conclusão

### 3. InspectionStepCard Component

**Purpose**: Exibe uma etapa individual com instruções e captura de foto

**Props**:
```typescript
interface InspectionStepCardProps {
  step: InspectionStep;
  stepNumber: number;
  totalSteps: number;
  capturedPhoto?: CapturedPhoto;
  onPhotoCapture: (photo: File) => Promise<void>;
  onPhotoReplace: (photo: File) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
}
```

**Behavior**:
- Exibe ilustração e instruções da etapa
- Fornece botões para câmera e galeria
- Mostra preview da foto capturada
- Habilita navegação conforme estado

### 4. FreeUploadMode Component

**Purpose**: Interface de upload livre para modelo "Livre"

**Props**:
```typescript
interface FreeUploadModeProps {
  inspectionId: string;
  onComplete: (photos: InspectionPhoto[]) => void;
  onCancel: () => void;
}
```

**Behavior**:
- Permite adicionar múltiplas fotos sem ordem específica
- Permite remover fotos individuais
- Não impõe validação de quantidade mínima


## Data Models

### VehicleModel Enum

```typescript
enum VehicleModel {
  CAVALO_6X4 = 'cavalo_6x4',
  CAVALO_6X2 = 'cavalo_6x2',
  CARRETA_RODOTREM_9_EIXOS = 'carreta_rodotrem_9_eixos',
  CARRETA_RODOTREM_GRANELEIRO = 'carreta_rodotrem_graneleiro',
  LIVRE = 'livre'
}
```

### InspectionStep Interface

```typescript
interface InspectionStep {
  id: string;
  label: string;
  instruction: string;
  illustrationUrl: string;
  order: number;
  isRequired: boolean;
}
```

### InspectionPhoto Interface

```typescript
interface InspectionPhoto {
  id: string;
  inspectionId: string;
  label: string;
  photoUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  metadata?: {
    width: number;
    height: number;
    exif?: Record<string, any>;
  };
}
```

### CapturedPhoto Interface

```typescript
interface CapturedPhoto {
  file: File;
  previewUrl: string;
  label: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  error?: string;
}
```

### Inspection Extension

```typescript
interface Inspection {
  // ... existing fields
  vehicleModel?: VehicleModel;
  isGuidedInspection: boolean;
  guidedPhotosComplete: boolean;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vistoria de Troca sempre exibe campo de modelo

*For any* vistoria criada com tipo "Troca", o campo "Modelo de Vistoria Guiada" deve estar presente e obrigatório na interface

**Validates: Requirements 1.1, 1.3**

### Property 2: Modelo de vistoria tem exatamente 5 opções

*For any* campo "Modelo de Vistoria Guiada" exibido, o conjunto de opções deve conter exatamente 5 elementos: Cavalo 6x4, Cavalo 6x2, Carreta Rodotrem 9 Eixos, Carreta Rodotrem Graneleiro, e Livre

**Validates: Requirements 1.2**

### Property 3: Vistoria de Manutenção omite campo de modelo

*For any* vistoria criada com tipo "Manutenção", o campo "Modelo de Vistoria Guiada" não deve estar presente na interface

**Validates: Requirements 1.4**

### Property 4: Modelo guiado carrega sequência de etapas

*For any* modelo de vistoria guiada selecionado (exceto "Livre"), o sistema deve carregar um array não-vazio de etapas ordenadas

**Validates: Requirements 2.1, 6.5**

### Property 5: Toda etapa tem ilustração e instruções

*For any* etapa de vistoria guiada exibida, os campos de ilustração (illustrationUrl) e instruções (instruction) devem ser não-nulos e não-vazios

**Validates: Requirements 2.2, 2.3**

### Property 6: Etapa fornece opções de captura

*For any* etapa de vistoria guiada exibida, os botões "Tirar Foto" e "Selecionar da Galeria" devem estar disponíveis

**Validates: Requirements 2.4**

### Property 7: Foto capturada habilita navegação

*For any* etapa onde uma foto foi capturada, o botão "Próxima Etapa" (ou "Concluir Vistoria" se última etapa) deve estar habilitado

**Validates: Requirements 2.6, 2.9**

### Property 8: Navegação preserva progresso

*For any* navegação entre etapas (avançar ou voltar), as fotos já capturadas devem permanecer associadas às suas respectivas etapas

**Validates: Requirements 2.7, 2.8, 8.4**

### Property 9: Modo Livre permite upload ilimitado

*For any* vistoria com modelo "Livre", o sistema deve permitir adicionar qualquer quantidade N de fotos sem impor limite máximo ou validação de quantidade mínima

**Validates: Requirements 3.4, 3.6**

### Property 10: Foto salva tem metadados completos

*For any* foto salva no sistema, os campos inspectionId, label, photoUrl e createdAt devem ser não-nulos

**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

### Property 11: Path de storage segue padrão estruturado

*For any* foto enviada ao Supabase Storage, o path deve seguir o formato "/inspections/{inspection_id}/{label}.jpg" onde inspection_id e label são valores válidos

**Validates: Requirements 4.3**

### Property 12: Vistoria guiada requer todas as etapas

*For any* vistoria guiada (modelo não-livre), a validação de completude deve retornar false se existir pelo menos uma etapa obrigatória sem foto associada

**Validates: Requirements 5.1, 5.2**

### Property 13: Vistoria completa permite conclusão

*For any* vistoria guiada onde todas as etapas obrigatórias possuem fotos, a validação de completude deve retornar true e permitir conclusão

**Validates: Requirements 5.3**

### Property 14: Cavalo 6x4 tem 7 etapas específicas

*For any* vistoria com modelo "Cavalo 6x4", a sequência de etapas deve conter exatamente 7 elementos com os labels: "Foto Frontal (ângulo 45º)", "Lateral esquerda completa", "Lateral direita completa", "Traseira (caixa)", "Painel interno (odômetro)", "Chassi lado esquerdo", "Chassi lado direito", nesta ordem

**Validates: Requirements 6.1**

### Property 15: Cavalo 6x2 equivale a Cavalo 6x4

*For any* par de vistorias com modelos "Cavalo 6x4" e "Cavalo 6x2", as sequências de etapas devem ser idênticas em quantidade, labels e ordem

**Validates: Requirements 6.2**

### Property 16: Rodotrem 9 Eixos tem 6 etapas específicas

*For any* vistoria com modelo "Carreta Rodotrem 9 Eixos", a sequência de etapas deve conter exatamente 6 elementos com os labels: "Vista frontal completa do conjunto", "Lateral esquerda completa", "Lateral direita completa", "Traseira completa", "Posição dos eixos", "Pneus detalhe (mínimo 4 fotos)", nesta ordem

**Validates: Requirements 6.3**

### Property 17: Graneleiro adiciona etapa de lona

*For any* vistoria com modelo "Carreta Rodotrem Graneleiro", a sequência de etapas deve conter as 6 etapas do Rodotrem 9 Eixos mais uma etapa adicional "Detalhe da lona ou tampa superior", totalizando 7 etapas

**Validates: Requirements 6.4**

### Property 18: Botões têm altura mínima acessível

*For any* botão de ação na interface de vistoria guiada, a altura deve ser maior ou igual a 48 pixels

**Validates: Requirements 7.3**

### Property 19: Indicador de progresso reflete etapa atual

*For any* navegação entre etapas, o indicador de progresso deve exibir corretamente a etapa atual e o total de etapas (ex: "3 de 7")

**Validates: Requirements 7.5**

### Property 20: Etapa com foto permite substituição

*For any* etapa que já possui foto capturada, o sistema deve exibir a foto atual e fornecer opção "Substituir Foto"

**Validates: Requirements 8.1**

### Property 21: Substituição mantém label original

*For any* foto substituída em uma etapa, o novo arquivo deve manter o mesmo label da etapa, apenas alterando a imagem

**Validates: Requirements 8.3**

### Property 22: Conclusão usa fotos mais recentes

*For any* vistoria concluída onde fotos foram substituídas, apenas as versões mais recentes de cada etapa devem ser salvas no storage

**Validates: Requirements 8.5**

### Property 23: Validação aceita formatos suportados

*For any* arquivo de imagem com formato JPEG, PNG ou WebP, a validação de formato deve retornar true

**Validates: Requirements 9.1**

### Property 24: Validação rejeita formatos não suportados

*For any* arquivo com formato diferente de JPEG, PNG ou WebP, a validação de formato deve retornar false e impedir o upload

**Validates: Requirements 9.2**

### Property 25: Imagens grandes são comprimidas

*For any* foto com tamanho superior a 10MB, o sistema deve aplicar compressão antes do upload, resultando em arquivo menor

**Validates: Requirements 9.3**

### Property 26: Fotos são ordenadas por label na visualização

*For any* vistoria guiada visualizada por gerente, as fotos devem aparecer ordenadas conforme a sequência de labels do modelo utilizado

**Validates: Requirements 10.1**

### Property 27: Modo Livre ordena por timestamp

*For any* vistoria com modelo "Livre" visualizada, as fotos devem aparecer ordenadas cronologicamente por createdAt

**Validates: Requirements 10.3**


## Error Handling

### Photo Upload Errors

**Scenarios**:
- Network failure during upload
- Storage quota exceeded
- Invalid file format
- File size exceeds limits
- Corrupted file

**Handling Strategy**:
```typescript
try {
  const uploadedPhoto = await photoService.upload(file, inspectionId, label);
  return { success: true, photo: uploadedPhoto };
} catch (error) {
  if (error instanceof NetworkError) {
    return { 
      success: false, 
      error: 'Falha na conexão. Verifique sua internet e tente novamente.',
      retryable: true 
    };
  }
  if (error instanceof StorageQuotaError) {
    return { 
      success: false, 
      error: 'Espaço de armazenamento insuficiente. Contate o administrador.',
      retryable: false 
    };
  }
  if (error instanceof InvalidFormatError) {
    return { 
      success: false, 
      error: 'Formato de arquivo inválido. Use JPEG, PNG ou WebP.',
      retryable: false 
    };
  }
  // Generic error
  return { 
    success: false, 
    error: 'Erro ao enviar foto. Tente novamente.',
    retryable: true 
  };
}
```

### Validation Errors

**Scenarios**:
- Attempting to advance without photo
- Attempting to complete with missing steps
- Invalid vehicle model selection

**Handling Strategy**:
- Display inline error messages
- Highlight incomplete steps
- Prevent navigation until resolved
- Provide clear guidance on what's missing

### Camera/Gallery Access Errors

**Scenarios**:
- Permission denied
- Camera not available
- Gallery access restricted

**Handling Strategy**:
```typescript
async function requestCameraAccess(): Promise<CameraAccessResult> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      return { 
        granted: false, 
        message: 'Permissão de câmera negada. Habilite nas configurações do navegador.' 
      };
    }
    if (error.name === 'NotFoundError') {
      return { 
        granted: false, 
        message: 'Câmera não encontrada. Use a opção "Selecionar da Galeria".' 
      };
    }
    return { 
      granted: false, 
      message: 'Erro ao acessar câmera. Tente novamente.' 
    };
  }
}
```


## Testing Strategy

### Unit Testing

**Focus Areas**:
1. **Validation Functions**
   - Test `validateInspectionComplete()` with various completion states
   - Test `validatePhotoFormat()` with different file types
   - Test `validateFileSize()` with various sizes

2. **Step Sequence Generation**
   - Test `getStepsForModel()` returns correct steps for each vehicle model
   - Test step order is preserved
   - Test Cavalo 6x2 equals Cavalo 6x4

3. **Photo Service**
   - Test path generation follows pattern
   - Test compression logic for large files
   - Test metadata extraction

4. **State Management**
   - Test navigation between steps
   - Test photo capture and replacement
   - Test progress tracking

**Example Unit Tests**:
```typescript
describe('validateInspectionComplete', () => {
  it('returns false when required steps are missing photos', () => {
    const steps = [
      { id: '1', label: 'Front', isRequired: true },
      { id: '2', label: 'Back', isRequired: true }
    ];
    const photos = new Map([['1', mockPhoto]]);
    expect(validateInspectionComplete(steps, photos)).toBe(false);
  });

  it('returns true when all required steps have photos', () => {
    const steps = [
      { id: '1', label: 'Front', isRequired: true },
      { id: '2', label: 'Back', isRequired: true }
    ];
    const photos = new Map([
      ['1', mockPhoto],
      ['2', mockPhoto]
    ]);
    expect(validateInspectionComplete(steps, photos)).toBe(true);
  });
});
```

### Property-Based Testing

**Framework**: fast-check (for TypeScript/JavaScript)

**Configuration**: Each property test should run minimum 100 iterations

**Property Tests**:

1. **Property 1: Vistoria de Troca sempre exibe campo de modelo**
   ```typescript
   // Feature: vistoria-guiada, Property 1: Vistoria de Troca sempre exibe campo de modelo
   it('should always show vehicle model field for Troca inspections', () => {
     fc.assert(
       fc.property(
         fc.record({
           type: fc.constant('Troca'),
           // other random inspection fields
         }),
         (inspection) => {
           const form = renderInspectionForm(inspection);
           expect(form.hasVehicleModelField()).toBe(true);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

2. **Property 10: Foto salva tem metadados completos**
   ```typescript
   // Feature: vistoria-guiada, Property 10: Foto salva tem metadados completos
   it('should save photos with complete metadata', () => {
     fc.assert(
       fc.property(
         fc.string(), // inspectionId
         fc.string(), // label
         fc.constantFrom('image/jpeg', 'image/png', 'image/webp'), // mimeType
         async (inspectionId, label, mimeType) => {
           const file = createMockFile(mimeType);
           const savedPhoto = await photoService.save(file, inspectionId, label);
           
           expect(savedPhoto.inspectionId).toBeTruthy();
           expect(savedPhoto.label).toBeTruthy();
           expect(savedPhoto.photoUrl).toBeTruthy();
           expect(savedPhoto.createdAt).toBeInstanceOf(Date);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

3. **Property 14: Cavalo 6x4 tem 7 etapas específicas**
   ```typescript
   // Feature: vistoria-guiada, Property 14: Cavalo 6x4 tem 7 etapas específicas
   it('should always return 7 specific steps for Cavalo 6x4', () => {
     const expectedLabels = [
       'Foto Frontal (ângulo 45º)',
       'Lateral esquerda completa',
       'Lateral direita completa',
       'Traseira (caixa)',
       'Painel interno (odômetro)',
       'Chassi lado esquerdo',
       'Chassi lado direito'
     ];
     
     fc.assert(
       fc.property(
         fc.constant(VehicleModel.CAVALO_6X4),
         (model) => {
           const steps = getStepsForModel(model);
           expect(steps).toHaveLength(7);
           expect(steps.map(s => s.label)).toEqual(expectedLabels);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

4. **Property 23: Validação aceita formatos suportados**
   ```typescript
   // Feature: vistoria-guiada, Property 23: Validação aceita formatos suportados
   it('should accept all supported image formats', () => {
     fc.assert(
       fc.property(
         fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
         (mimeType) => {
           const file = createMockFile(mimeType);
           expect(validatePhotoFormat(file)).toBe(true);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

5. **Property 25: Imagens grandes são comprimidas**
   ```typescript
   // Feature: vistoria-guiada, Property 25: Imagens grandes são comprimidas
   it('should compress images larger than 10MB', () => {
     fc.assert(
       fc.property(
         fc.integer({ min: 10_000_001, max: 50_000_000 }), // size in bytes > 10MB
         async (fileSize) => {
           const largeFile = createMockFileWithSize(fileSize);
           const compressed = await compressPhoto(largeFile);
           expect(compressed.size).toBeLessThan(largeFile.size);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

### Integration Testing

**Focus Areas**:
1. Complete flow from model selection to photo upload
2. Navigation between steps with state persistence
3. Photo replacement workflow
4. Validation and completion flow
5. Error recovery scenarios

**Example Integration Test**:
```typescript
describe('Guided Inspection Flow', () => {
  it('should complete full inspection workflow', async () => {
    // Select vehicle model
    await selectVehicleModel(VehicleModel.CAVALO_6X4);
    
    // Capture photos for all steps
    const steps = getStepsForModel(VehicleModel.CAVALO_6X4);
    for (const step of steps) {
      await capturePhotoForStep(step);
      await clickNext();
    }
    
    // Complete inspection
    await clickComplete();
    
    // Verify all photos were saved
    const savedPhotos = await getInspectionPhotos(inspectionId);
    expect(savedPhotos).toHaveLength(7);
    expect(savedPhotos.every(p => p.photoUrl)).toBe(true);
  });
});
```

### Manual Testing Checklist

- [ ] Test camera access on different devices (mobile, tablet, desktop)
- [ ] Test gallery selection on different platforms
- [ ] Verify illustrations display correctly for each step
- [ ] Verify instructions are clear and readable
- [ ] Test offline behavior and error messages
- [ ] Test with slow network connections
- [ ] Verify responsive design on various screen sizes
- [ ] Test accessibility with screen readers
- [ ] Verify photo quality after compression
- [ ] Test with various image formats and sizes

