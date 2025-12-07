# Correção: Fotos em Vistorias de Manutenção

## Problemas Identificados

1. **Fotos não eram salvas**: As fotos selecionadas não eram enviadas ao banco de dados
2. **Marca d'água não funcionava**: A marca d'água não estava sendo aplicada
3. **Preview não estava em 4:3**: As fotos eram exibidas em formato quadrado

## Soluções Implementadas

### 1. Armazenamento de Fotos

**Problema**: O componente armazenava apenas URLs de preview (strings), não os arquivos reais.

**Solução**: Separar o armazenamento de arquivos e URLs de preview:

```typescript
const [photos, setPhotos] = useState<File[]>([]);  // Arquivos reais
const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);  // URLs para preview
```

### 2. Upload com Marca D'água

**Problema**: As fotos não eram processadas nem enviadas ao Supabase.

**Solução**: Implementado fluxo completo de upload:

```typescript
// 1. Criar a vistoria
const inspection = await addInspection({...});

// 2. Para cada foto:
for (let i = 0; i < photos.length; i++) {
  const file = photos[i];
  
  // Aplicar marca d'água
  const watermarkedFile = await applyWatermark(file, plate);
  
  // Upload da foto
  await uploadAndSaveInspectionPhoto(
    inspection.id,
    watermarkedFile,
    `Foto ${i + 1}`,
    i + 1
  );
}
```

**Funções utilizadas**:
- `applyWatermark()`: Aplica marca d'água com a placa do veículo
- `uploadAndSaveInspectionPhoto()`: Faz upload para Supabase Storage e cria registro no banco

### 3. Preview em Formato 4:3

**Problema**: Preview das fotos estava em formato quadrado (`aspect-square`).

**Solução**: Alterado para formato 4:3:

```typescript
<div className="relative aspect-[4/3]">
  <img
    src={url}
    alt={`Foto ${index + 1}`}
    className="w-full h-full object-cover rounded-lg"
  />
</div>
```

**Grid ajustado**: De 3-4 colunas para 2-3 colunas para melhor visualização:
- Mobile: 2 colunas
- Desktop: 3 colunas

## Fluxo Completo

1. **Usuário seleciona fotos**
   - Arquivos são armazenados em `photos` (File[])
   - URLs de preview são criadas e armazenadas em `photoPreviewUrls`

2. **Preview é exibido**
   - Formato 4:3
   - Botão de remoção em cada foto

3. **Ao submeter o formulário**
   - Vistoria é criada no banco
   - Para cada foto:
     - Marca d'água é aplicada
     - Foto é enviada ao Supabase Storage
     - Registro é criado na tabela `inspection_photos`

4. **Limpeza de memória**
   - URLs de preview são revogadas ao desmontar o componente
   - URLs são revogadas ao remover fotos individuais

## Arquivos Modificados

- `src/pages/NewInspection.tsx`: Implementação completa do fluxo de fotos

## Dependências

- `@/lib/photo-service`: Função `applyWatermark()`
- `@/lib/supabase-queries`: Função `uploadAndSaveInspectionPhoto()`

## Benefícios

1. **Fotos são salvas corretamente**: Todas as fotos selecionadas são enviadas ao banco
2. **Marca d'água automática**: Cada foto recebe a placa do veículo como marca d'água
3. **Preview profissional**: Formato 4:3 padrão para fotos de veículos
4. **Gestão de memória**: URLs de preview são limpas adequadamente
5. **Feedback ao usuário**: Toast de sucesso ou erro após o processo

## Teste

Para testar:
1. Criar uma vistoria de manutenção
2. Adicionar fotos
3. Verificar preview em formato 4:3
4. Submeter o formulário
5. Verificar no banco de dados se as fotos foram salvas
6. Verificar se a marca d'água foi aplicada
