# Atualização das Etapas da Vistoria Guiada - Cavalo (15 Etapas)

## Data: 10/12/2025

## Resumo
As etapas da vistoria guiada do cavalo foram atualizadas de 9 para 15 etapas, com novas regras de quantidade de fotos por etapa.

## Novas 15 Etapas

| # | Etapa | Quantidade de Fotos |
|---|-------|---------------------|
| 1 | Frontal 45° (Lado Motorista) | 1 foto |
| 2 | Frontal 45° (Lado Passageiro) | 1 foto |
| 3 | Lateral Completa (Lado Passageiro) | 1 foto |
| 4 | Lateral Completa (Lado Motorista) | 1 foto |
| 5 | Traseira (Mostrando Suspensão) | 1 foto |
| 6 | Pneus Dianteiros (Ambos os lados) | 2 fotos (1 de cada lado) |
| 7 | Pneus Traseiros (Ambos os lados) | 6 fotos (3 de cada lado) |
| 8 | Interna Lado Motorista | 2 fotos (porta + banco com volante) |
| 9 | Interna Lado Passageiro (+ Plaqueta) | 1-2 fotos |
| 10 | Interna Cabine (Lado Motorista) | 1 foto |
| 11 | Interna Painel | 1 foto |
| 12 | Tacógrafo | 1 foto |
| 13 | Teto Completo | 1 foto |
| 14 | Documento (CRLV) | 1 foto |
| 15 | Detalhes em Observação | 1-10 fotos |

## Alterações Realizadas

### 1. Banco de Dados (Supabase)
- Migração `update_cavalo_15_steps` aplicada
- Removidas as 9 etapas antigas
- Inseridas as 15 novas etapas com instruções atualizadas

### 2. Frontend (GuidedInspection.tsx)
- Criada função `getPhotoConfig()` para centralizar configuração de fotos
- Atualizada lógica de validação de mínimo/máximo de fotos
- Atualizada exibição de progresso e status das fotos
- Simplificado código removendo condicionais repetitivos

## Configuração de Fotos por Etapa

```typescript
const getPhotoConfig = (label: string | undefined) => {
  // Pneus Dianteiros: 2 fotos obrigatórias
  // Pneus Traseiros: 6 fotos obrigatórias
  // Interna Lado Motorista: 2 fotos obrigatórias
  // Interna Lado Passageiro: 1-2 fotos
  // Detalhes em Observação: 1-10 fotos
  // Demais etapas: 1 foto única
};
```

## Total de Fotos
- Mínimo: 22 fotos
- Máximo: 31 fotos
