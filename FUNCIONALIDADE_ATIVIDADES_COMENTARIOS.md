# 🔧 Funcionalidade: Atividades e Comentários em Vistorias

## ✅ Implementação Completa

Esta funcionalidade permite adicionar **novas atividades de vistoria** e **comentários colaborativos** a vistorias já existentes.

---

## 🗄️ Estrutura do Banco de Dados

### Novas Tabelas Criadas

#### 1. `inspection_activities`
Armazena atividades adicionais vinculadas a uma vistoria principal.

```sql
- id: UUID (PK)
- inspection_id: UUID (FK → inspections)
- type: TEXT ('livre' | 'guiada')
- vehicle_model: TEXT (opcional, para vistorias guiadas)
- created_by: UUID (FK → users)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### 2. `inspection_activity_photos`
Armazena fotos das atividades adicionais.

```sql
- id: UUID (PK)
- activity_id: UUID (FK → inspection_activities)
- label: TEXT
- step_order: INTEGER (opcional)
- photo_url: TEXT
- thumbnail_url: TEXT (opcional)
- file_size: INTEGER
- mime_type: TEXT
- width: INTEGER
- height: INTEGER
- exif_data: JSONB
- created_at: TIMESTAMPTZ
```

#### 3. `inspection_comments`
Armazena comentários colaborativos estilo Trello.

```sql
- id: UUID (PK)
- inspection_id: UUID (FK → inspections)
- user_id: UUID (FK → users)
- content: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

---

## 🎨 Componentes React Criados

### 1. `InspectionComments.tsx`
Interface de comentários colaborativos:
- Lista todos os comentários em ordem cronológica
- Mostra nome do usuário, role e data/hora
- Campo de texto para adicionar novos comentários
- Botão de exclusão (apenas para autor ou gerente)

### 2. `InspectionActivities.tsx`
Gerenciamento de atividades adicionais:
- Lista todas as atividades com tipo, modelo e quantidade de fotos
- Formulário para criar nova atividade (livre ou guiada)
- Botão para visualizar detalhes de cada atividade
- Redireciona para o fluxo apropriado (livre ou guiado)

---

## 📄 Páginas Criadas

### 1. `ActivityFreeInspection.tsx`
Captura de fotos para vistoria livre adicional:
- Upload de múltiplas fotos
- Campo de descrição personalizada para cada foto
- Preview das fotos capturadas
- Finalização e upload para o Supabase Storage

### 2. `ActivityGuidedInspection.tsx`
Vistoria guiada adicional com etapas:
- Carrega etapas do template baseado no modelo do veículo
- Barra de progresso
- Captura de foto para cada etapa
- Navegação entre etapas (anterior/próxima)
- Finalização e upload de todas as fotos

### 3. `ActivityView.tsx`
Visualização de atividade concluída:
- Exibe tipo de atividade (livre/guiada)
- Mostra modelo do veículo (se guiada)
- Galeria de fotos da atividade
- Data de criação

---

## 🔄 Fluxo de Uso

### Adicionar Nova Atividade

1. Usuário acessa detalhes de uma vistoria existente
2. Clica em "Nova Atividade" na seção "Atividades Adicionais"
3. Sistema exibe dados do veículo da vistoria original (placa, modelo)
4. Escolhe o tipo:
   - **Livre**: Upload de fotos com descrições personalizadas
   - **Guiada**: Segue etapas predefinidas do modelo de veículo herdado
5. Sistema valida: se vistoria pai é "livre", apenas atividade livre é permitida
6. Captura as fotos necessárias
7. Finaliza a atividade
8. Sistema salva no banco e storage
9. Retorna para a página de detalhes da vistoria

### Adicionar Comentário

1. Usuário acessa detalhes de uma vistoria
2. Rola até a seção "Comentários"
3. Digita o comentário no campo de texto
4. Clica em "Comentar"
5. Comentário aparece imediatamente na lista
6. Qualquer usuário pode ver todos os comentários
7. Autor ou gerente pode excluir seus próprios comentários

---

## 🛣️ Rotas Adicionadas

```typescript
/inspection/:id                          // Detalhes da vistoria (com atividades e comentários)
/inspection-activity/:activityId/free    // Vistoria livre adicional
/inspection-activity/:activityId/guided  // Vistoria guiada adicional
/inspection-activity/:activityId/view    // Visualizar atividade concluída
```

---

## 🔐 Permissões

- ✅ Todos os usuários logados podem:
  - Ver comentários
  - Adicionar comentários
  - **Curtir qualquer comentário**
  - Criar novas atividades
  - Ver atividades existentes

- ✅ Apenas autor pode:
  - **Editar seus próprios comentários**
  - **Excluir seus próprios comentários**
  - Deletar suas próprias atividades (com todas as fotos)

- ✅ Gerentes podem:
  - Deletar atividades de qualquer usuário

---

## 📦 Arquivos Modificados

### Novos Arquivos
- `src/components/InspectionComments.tsx`
- `src/components/InspectionActivities.tsx`
- `src/pages/ActivityFreeInspection.tsx`
- `src/pages/ActivityGuidedInspection.tsx`
- `src/pages/ActivityView.tsx`

### Arquivos Modificados
- `src/lib/supabase-queries.ts` - Adicionadas queries para atividades e comentários
- `src/pages/InspectionDetail.tsx` - Adicionados componentes de atividades e comentários
- `src/App.tsx` - Adicionadas novas rotas

### Migração do Banco
- Migração aplicada via MCP Supabase: `add_inspection_activities_and_comments`

---

## 🎯 Características Implementadas

✅ Adicionar atividades de vistoria livre ou guiada  
✅ Upload de fotos para atividades  
✅ Comentários colaborativos estilo Facebook  
✅ Sistema de curtidas nos comentários  
✅ Editar comentários (apenas autor)  
✅ Excluir comentários (apenas autor)  
✅ Visualização de atividades concluídas  
✅ Deletar atividades (autor ou gerente)  
✅ Integração com Supabase Storage  
✅ Interface flat design com fonte Poppins  
✅ Permissões adequadas (RLS)  
✅ Validação de arquivos (tipo e tamanho)  
✅ Preview de fotos antes do upload  
✅ Feedback visual (toasts)  
✅ Responsivo e acessível  

---

## 🚀 Como Testar

1. Faça login no sistema
2. Acesse uma vistoria existente
3. Role até "Atividades Adicionais"
4. Clique em "Nova Atividade"
5. Escolha o tipo e capture fotos
6. Finalize a atividade
7. Role até "Comentários"
8. Adicione um comentário
9. Verifique que o comentário aparece com seu nome e data/hora

---

## 📝 Observações

- As atividades **herdam automaticamente** o modelo de veículo da vistoria pai
- Não é necessário informar novamente: placa, modelo, ano ou status
- Se a vistoria pai for "livre", apenas atividades livres podem ser criadas
- Atividades guiadas usam as etapas do modelo herdado da vistoria original
- Fotos são armazenadas no mesmo bucket `inspection-photos` em subpastas organizadas
- Comentários são exibidos em ordem cronológica (mais antigos primeiro)
- Sistema suporta múltiplas atividades por vistoria
- Cada atividade mantém seu próprio conjunto de fotos independente

---

## 🔧 Tecnologias Utilizadas

- **React** + TypeScript
- **Supabase** (Database + Storage)
- **Tailwind CSS** (Estilização)
- **React Router** (Navegação)
- **Lucide React** (Ícones)
- **Shadcn/ui** (Componentes)
