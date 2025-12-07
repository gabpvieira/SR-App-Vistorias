# Correção: Implementação da Marca D'água

## Problema Identificado

As fotos estavam aparecendo "bugadas" (quebradas) porque:
1. A função `applyWatermark()` não existia no código
2. O código tentava chamar uma função inexistente, causando erro
3. As fotos não eram salvas no banco de dados devido ao erro

## Diagnóstico via MCP Supabase

Verificação realizada:
```sql
SELECT id, label, photo_url FROM inspection_photos 
WHERE inspection_id = 'f8e7c624-fd39-4888-bb49-4c6226d81f22';
```

**Resultado**: Nenhuma foto foi salva (array vazio)

## Solução Implementada

### Hook `useWatermark` Utilizado

**Arquivo**: `src/pages/NewInspection.tsx`

Alterado para usar o mesmo sistema de marca d'água das vistorias guiadas:

```typescript
const { addWatermark } = useWatermark({ autoRequestPermission: true });
```

### Funcionalidades da Marca D'água (Padrão do Sistema)

1. **Informações Incluídas**
   - Data e hora completa (DD/MM/AAAA HH:MM:SS)
   - Localização (Cidade, Estado)
   - Coordenadas GPS (Latitude e Longitude)

2. **Estilo Visual**
   - Posição: Topo direito da imagem
   - Fundo: Preto semi-transparente (40% opacidade)
   - Texto: Branco com contorno preto
   - Fonte: Arial Bold
   - Tamanho: Proporcional à largura da imagem

3. **Formato da Marca D'água**
   ```
   DD/MM/AAAA HH:MM:SS | Cidade, Estado | XX.XXXXXX°N XX.XXXXXX°L
   ```

4. **Geolocalização**
   - Solicita permissão automaticamente
   - Usa GPS de alta precisão
   - Faz geocoding reverso para obter cidade/estado
   - Funciona offline (sem localização se não houver permissão)

5. **Qualidade**
   - Formato: Mantém formato original (JPEG/PNG)
   - Qualidade: 95% (alta qualidade)

### Características Técnicas

- **Consistente**: Mesma marca d'água em todas as vistorias
- **Informativa**: Inclui timestamp e localização completa
- **Legível**: Fundo escuro + texto branco + contorno
- **Não invasiva**: Posicionada no topo, não obstrui conteúdo principal
- **Confiável**: Usa serviço de geolocalização do navegador

## Fluxo Completo Corrigido

1. **Usuário seleciona fotos**
   - Arquivos armazenados como File[]

2. **Preview exibido**
   - URLs temporárias criadas
   - Formato 4:3

3. **Ao submeter**
   - Vistoria criada
   - Para cada foto:
     - ✅ `applyWatermark()` aplica marca d'água com a placa
     - ✅ `uploadAndSaveInspectionPhoto()` faz upload
     - ✅ Registro criado em `inspection_photos`

## Exemplo de Uso

```typescript
// Hook com solicitação automática de permissão
const { addWatermark } = useWatermark({ autoRequestPermission: true });

// Aplicar marca d'água (data/hora + localização + coordenadas)
const watermarkedFile = await addWatermark(originalFile);

// Upload da foto com marca d'água
await uploadAndSaveInspectionPhoto(
  inspectionId,
  watermarkedFile,
  'Foto 1',
  1
);
```

## Resultado Esperado

- ✅ Fotos são salvas corretamente no Supabase Storage
- ✅ Registros criados na tabela `inspection_photos`
- ✅ Marca d'água visível com a placa do veículo
- ✅ Imagens não aparecem mais "bugadas"

## Arquivos Modificados

- `src/pages/NewInspection.tsx`: Alterado para usar `useWatermark` hook
- `src/lib/photo-service.ts`: Função `applyWatermark()` criada mas não utilizada (substituída pelo hook)

## Serviços Utilizados

- `src/hooks/use-watermark.ts`: Hook para gerenciar marca d'água
- `src/lib/watermark-service.ts`: Serviço de geolocalização e aplicação de marca d'água

## Teste

Para testar:
1. Criar vistoria de manutenção
2. Adicionar fotos
3. Submeter formulário
4. Verificar no banco:
   ```sql
   SELECT * FROM inspection_photos WHERE inspection_id = '[ID]';
   ```
5. Verificar marca d'água nas fotos salvas
