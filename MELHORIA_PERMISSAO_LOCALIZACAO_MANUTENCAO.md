# Melhoria: Solicitação de Permissão de Localização em Vistorias de Manutenção

## Objetivo

Solicitar permissão de localização automaticamente quando o usuário seleciona "Manutenção" como tipo de vistoria, garantindo que a marca d'água inclua informações de localização (cidade, estado e coordenadas GPS).

## Implementação

### Mudanças no Hook useWatermark

**Arquivo**: `src/pages/NewInspection.tsx`

Alterado para não solicitar permissão automaticamente no mount, mas sim quando necessário:

```typescript
// Antes
const { addWatermark } = useWatermark({ autoRequestPermission: true });

// Depois
const { addWatermark, requestPermission, isLocationEnabled } = useWatermark({ 
  autoRequestPermission: false 
});
```

### Solicitação ao Selecionar Manutenção

Adicionada lógica no botão "Manutenção":

```typescript
<button
  type="button"
  onClick={async () => {
    setType('manutencao');
    setVehicleModel(null);
    if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
    
    // Solicitar permissão de localização para marca d'água
    if (!isLocationEnabled) {
      await requestPermission();
    }
  }}
>
  Manutenção
</button>
```

## Fluxo de Uso

1. **Usuário acessa "Nova Vistoria"**
   - Nenhuma permissão é solicitada ainda

2. **Usuário clica em "Manutenção"**
   - Sistema verifica se já tem permissão de localização
   - Se não tiver, solicita permissão ao usuário
   - Navegador exibe popup de permissão

3. **Usuário concede permissão**
   - Sistema obtém localização atual
   - Faz geocoding reverso para obter cidade/estado
   - Armazena dados para uso nas fotos

4. **Usuário adiciona fotos**
   - Marca d'água é aplicada com:
     - Data/hora
     - Cidade, Estado
     - Coordenadas GPS

## Benefícios

1. **Experiência Melhorada**
   - Permissão solicitada no momento certo
   - Usuário entende por que a permissão é necessária

2. **Marca D'água Completa**
   - Inclui localização real da vistoria
   - Informações geográficas precisas

3. **Rastreabilidade**
   - Fotos com localização verificável
   - Timestamp e coordenadas GPS

4. **Não Invasivo**
   - Permissão só é solicitada se necessário
   - Não solicita em vistorias de "Troca" (que usam vistoria guiada)

## Comportamento

### Se Usuário Concede Permissão
- ✅ Localização obtida
- ✅ Cidade e estado identificados
- ✅ Marca d'água completa aplicada

### Se Usuário Nega Permissão
- ⚠️ Marca d'água aplicada sem localização
- ⚠️ Apenas data/hora incluída
- ✅ Vistoria continua funcionando normalmente

## Exemplo de Marca D'água

### Com Permissão
```
07/12/2024 15:30:45 | São Paulo, SP | 23.550520°S 46.633308°O
```

### Sem Permissão
```
07/12/2024 15:30:45
```

## Arquivos Modificados

- `src/pages/NewInspection.tsx`: Adicionada solicitação de permissão ao selecionar manutenção

## Compatibilidade

- ✅ Desktop: Funciona em todos os navegadores modernos
- ✅ Mobile: Funciona em iOS Safari e Android Chrome
- ✅ PWA: Funciona quando instalado como app

## Privacidade

- Permissão solicitada explicitamente
- Usuário pode negar sem impedir o uso
- Localização não é armazenada separadamente
- Apenas incluída na marca d'água da foto
