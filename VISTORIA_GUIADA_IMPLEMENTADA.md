# ✅ Vistoria Guiada Implementada

## 🎯 Funcionalidade

Sistema de vistoria guiada com etapas obrigatórias para veículos do tipo **"Troca"**.

## 📋 Modelos Disponíveis

### 1. Cavalo (9 etapas)
1. Frontal 45° – Lado Motorista
2. Lateral Completa – Lado Motorista
3. Lateral Completa – Lado Passageiro
4. Traseira – Área de Suspensão
5. Pneus Dianteiros (mínimo 2 fotos)
6. Painel Interno
7. Chassi lado direito
8. Pneus dianteiros (completos)
9. Pneus traseiros (mínimo 2 ângulos)
10. Painel interno com odômetro
11. **Tacógrafo (de forma legível)** ✨ NOVO
12. **Interior lateral do motorista** ✨ NOVO
13. **Interior lateral do passageiro** ✨ NOVO

### 2. Rodotrem Basculante (7 etapas)
1. Vista frontal do conjunto
2. Lateral esquerda completa
3. Lateral direita completa
4. Traseira
5. Detalhe dos eixos
6. Detalhe dos pneus (mínimo 4 fotos)
7. Sistema basculante

### 3. Rodotrem Graneleiro (7 etapas)
1. Vista frontal do conjunto
2. Lateral esquerda completa
3. Lateral direita completa
4. Traseira
5. Detalhe dos eixos
6. Detalhe dos pneus (mínimo 4 fotos)
7. Tampa ou lona superior

### 4. Livre
- Upload livre de fotos
- Sem etapas obrigatórias

## 🔄 Fluxo de Uso

1. **Nova Vistoria** → Selecionar tipo "Troca"
2. **Escolher Modelo** → Cavalo, Rodotrem Basculante, Rodotrem Graneleiro ou Livre
3. **Informar Placa** → Formato ABC-1234 ou ABC1D23
4. **Iniciar Vistoria Guiada** → Redireciona para `/vistoria/guiada`
5. **Seguir Etapas** → Cada etapa mostra:
   - Título da foto
   - Instrução clara
   - Botões: "Tirar Foto" e "Galeria"
   - Preview da foto capturada
6. **Navegação** → Botões "Voltar" e "Próxima Etapa"
7. **Finalizar** → Última etapa mostra "Finalizar Vistoria"
8. **Upload Automático** → Todas as fotos são enviadas ao Supabase
9. **Redirecionamento** → Volta para Dashboard

## 🎨 UI/UX

- **Barra de progresso** → Mostra "Etapa X de Y" e porcentagem
- **Preview de foto** → Exibe foto capturada ou placeholder
- **Validação** → Não permite avançar sem foto
- **Feedback visual** → Checkmark verde quando foto é capturada
- **Contador** → "X de Y fotos capturadas"
- **Design limpo** → Fundo branco, fonte Poppins

## 📁 Arquivos Criados/Modificados

### Criados
1. `src/pages/GuidedInspection.tsx` - Página principal da vistoria guiada
2. `src/components/ui/progress.tsx` - Componente de barra de progresso

### Modificados
1. `src/pages/NewInspection.tsx` - Adicionado seletor de modelo e redirecionamento
2. `src/App.tsx` - Adicionada rota `/vistoria/guiada`
3. `src/lib/supabase-queries.ts` - Função `uploadAndSaveInspectionPhoto()`

### Banco de Dados
- Templates atualizados no Supabase (27 etapas totais)

## 🔐 Regras de Negócio

1. **Tipo "Troca"** → Obrigatório selecionar modelo
2. **Modelos guiados** → Todas as etapas são obrigatórias
3. **Modelo "Livre"** → Sem etapas, upload livre
4. **Tipo "Manutenção"** → Sem vistoria guiada, upload livre
5. **Validação de placa** → Formato brasileiro (ABC-1234 ou ABC1D23)
6. **Limite de arquivo** → 10MB por foto
7. **Formatos aceitos** → JPEG, JPG, PNG, WEBP

## 📸 Armazenamento

### Estrutura no Storage
```
inspection-photos/
  └── inspections/
      └── {inspection-id}/
          ├── 1-Frontal_45.jpg
          ├── 2-Frente_reta.jpg
          ├── 3-Lateral_esquerda_completa.jpg
          └── ...
```

### Metadata no Banco
Cada foto salva:
- `inspection_id` - ID da vistoria
- `label` - Nome da etapa
- `step_order` - Ordem da etapa
- `photo_url` - URL pública
- `file_size` - Tamanho em bytes
- `mime_type` - Tipo do arquivo
- `width` / `height` - Dimensões
- `created_at` - Data de upload

## 🚀 Como Testar

1. Acesse http://localhost:8080/dashboard
2. Faça login (ex: joao@srcaminhoes.com.br / 12345678)
3. Clique em "Nova Vistoria"
4. Selecione tipo "Troca"
5. Escolha modelo "Cavalo"
6. Informe placa (ex: ABC-1234)
7. Clique em "Iniciar Vistoria Guiada"
8. Siga as 9 etapas tirando/selecionando fotos
9. Clique em "Finalizar Vistoria"
10. Verifique no Dashboard a vistoria criada

## ✅ Status

🎉 **Vistoria Guiada 100% Funcional!**

- ✅ Templates no banco atualizados
- ✅ Página de vistoria guiada criada
- ✅ Navegação entre etapas
- ✅ Captura de fotos (câmera e galeria)
- ✅ Upload automático para Supabase
- ✅ Validação de etapas obrigatórias
- ✅ Barra de progresso
- ✅ Feedback visual
- ✅ Integração completa com banco

## 🔜 Melhorias Futuras

- [ ] Adicionar ilustrações para cada etapa
- [ ] Implementar rascunho automático
- [ ] Compressão de imagens grandes
- [ ] Preview antes de finalizar
- [ ] Edição de fotos já capturadas
- [ ] Modo offline com sincronização
