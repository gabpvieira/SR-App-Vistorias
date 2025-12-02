# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema de Vistoria Guiada por Tipo de Veículo no aplicativo SR Caminhões. O sistema permitirá que vendedores realizem vistorias de troca seguindo um fluxo estruturado de captura de fotos, com instruções visuais e textuais para cada etapa, garantindo padronização e qualidade nas inspeções de veículos seminovos.

## Glossary

- **Sistema**: O aplicativo SR Caminhões de gestão de vistorias
- **Vistoria de Troca**: Tipo de inspeção realizada quando um veículo é recebido em troca
- **Vistoria de Manutenção**: Tipo de inspeção para verificação de manutenção de veículos
- **Modelo de Vistoria Guiada**: Template pré-definido de etapas fotográficas baseado no tipo de veículo
- **Etapa**: Passo individual no fluxo de vistoria que requer uma foto específica
- **Label**: Identificador textual da posição ou ângulo da foto (ex: "Lateral esquerda completa")
- **Vendedor**: Usuário do sistema responsável por realizar vistorias
- **Gerente**: Usuário do sistema com permissões administrativas
- **Upload**: Processo de envio de foto para o sistema
- **Supabase Storage**: Serviço de armazenamento de arquivos utilizado pelo sistema

## Requirements

### Requirement 1

**User Story:** Como vendedor, eu quero selecionar o tipo de veículo ao criar uma vistoria de troca, para que o sistema me guie através das fotos necessárias.

#### Acceptance Criteria

1. WHEN a vistoria do tipo "Troca" é criada, THEN the Sistema SHALL exibir um campo obrigatório "Modelo de Vistoria Guiada"
2. WHEN o campo "Modelo de Vistoria Guiada" é exibido, THEN the Sistema SHALL apresentar cinco opções: "Cavalo 6x4", "Cavalo 6x2", "Carreta Rodotrem 9 Eixos", "Carreta Rodotrem Graneleiro" e "Livre"
3. WHEN o vendedor tenta avançar sem selecionar um modelo, THEN the Sistema SHALL impedir o avanço e exibir mensagem de validação
4. WHEN uma vistoria do tipo "Manutenção" é criada, THEN the Sistema SHALL omitir o campo "Modelo de Vistoria Guiada"

### Requirement 2

**User Story:** Como vendedor, eu quero seguir um fluxo guiado de fotos com instruções visuais, para que eu possa capturar as imagens corretas de cada ângulo do veículo.

#### Acceptance Criteria

1. WHEN um modelo de vistoria guiada (Cavalo 6x4, Cavalo 6x2, Carreta Rodotrem 9 Eixos, ou Carreta Rodotrem Graneleiro) é selecionado, THEN the Sistema SHALL exibir a primeira etapa do fluxo com desenho ilustrativo e instruções textuais
2. WHEN uma etapa é exibida, THEN the Sistema SHALL apresentar um desenho ilustrativo da parte do veículo a ser fotografada
3. WHEN uma etapa é exibida, THEN the Sistema SHALL apresentar texto com instruções de ângulo e distância
4. WHEN uma etapa é exibida, THEN the Sistema SHALL fornecer botões "Tirar Foto" e "Selecionar da Galeria"
5. WHEN o vendedor captura ou seleciona uma foto, THEN the Sistema SHALL exibir preview da imagem capturada
6. WHEN uma foto é capturada, THEN the Sistema SHALL habilitar o botão "Próxima Etapa"
7. WHEN o vendedor clica em "Próxima Etapa", THEN the Sistema SHALL avançar para a próxima etapa da sequência
8. WHEN o vendedor está em uma etapa após a primeira, THEN the Sistema SHALL exibir botão "Voltar" para retornar à etapa anterior
9. WHEN a última etapa é concluída, THEN the Sistema SHALL exibir botão "Concluir Vistoria"

### Requirement 3

**User Story:** Como vendedor, eu quero ter flexibilidade para adicionar fotos livremente quando seleciono o modelo "Livre", para que eu possa documentar vistorias que não seguem padrões específicos.

#### Acceptance Criteria

1. WHEN o modelo "Livre" é selecionado, THEN the Sistema SHALL exibir interface de upload livre sem etapas pré-definidas
2. WHEN a interface de upload livre é exibida, THEN the Sistema SHALL apresentar botão "Adicionar Foto"
3. WHEN o vendedor clica em "Adicionar Foto", THEN the Sistema SHALL permitir captura ou seleção de foto da galeria
4. WHEN uma foto é adicionada no modo livre, THEN the Sistema SHALL permitir adicionar múltiplas fotos sem limite de sequência
5. WHEN o vendedor adiciona fotos no modo livre, THEN the Sistema SHALL permitir remover fotos individuais
6. WHEN o vendedor finaliza no modo livre, THEN the Sistema SHALL permitir conclusão da vistoria com qualquer quantidade de fotos

### Requirement 4

**User Story:** Como sistema, eu preciso armazenar cada foto com metadados estruturados, para que as imagens possam ser recuperadas e identificadas corretamente.

#### Acceptance Criteria

1. WHEN uma foto é capturada em uma etapa guiada, THEN the Sistema SHALL associar a foto ao inspection_id correspondente
2. WHEN uma foto é capturada em uma etapa guiada, THEN the Sistema SHALL associar a foto ao label da etapa (ex: "Lateral esquerda completa")
3. WHEN uma foto é enviada ao storage, THEN the Sistema SHALL armazenar a foto no path estruturado "/inspections/{inspection_id}/{label}.jpg"
4. WHEN uma foto é salva, THEN the Sistema SHALL registrar o timestamp de criação (created_at)
5. WHEN uma foto é salva com sucesso, THEN the Sistema SHALL armazenar a URL de acesso (photo_url)

### Requirement 5

**User Story:** Como vendedor, eu preciso completar todas as etapas obrigatórias antes de finalizar, para garantir que a vistoria está completa e padronizada.

#### Acceptance Criteria

1. WHEN o vendedor tenta concluir uma vistoria guiada, THEN the Sistema SHALL verificar se todas as etapas obrigatórias possuem fotos
2. WHEN etapas obrigatórias não possuem fotos, THEN the Sistema SHALL impedir a conclusão e exibir lista de etapas pendentes
3. WHEN todas as etapas obrigatórias possuem fotos, THEN the Sistema SHALL permitir a conclusão da vistoria
4. WHEN a vistoria é concluída com sucesso, THEN the Sistema SHALL salvar todas as fotos no Supabase Storage
5. WHEN a vistoria é concluída com sucesso, THEN the Sistema SHALL redirecionar o vendedor para a tela de confirmação

### Requirement 6

**User Story:** Como sistema, eu preciso definir sequências específicas de etapas para cada tipo de veículo, para padronizar o processo de vistoria.

#### Acceptance Criteria

1. WHEN o modelo "Cavalo 6x4" é selecionado, THEN the Sistema SHALL carregar sequência com 7 etapas: "Foto Frontal (ângulo 45º)", "Lateral esquerda completa", "Lateral direita completa", "Traseira (caixa)", "Painel interno (odômetro)", "Chassi lado esquerdo", "Chassi lado direito"
2. WHEN o modelo "Cavalo 6x2" é selecionado, THEN the Sistema SHALL carregar a mesma sequência do modelo "Cavalo 6x4"
3. WHEN o modelo "Carreta Rodotrem 9 Eixos" é selecionado, THEN the Sistema SHALL carregar sequência com 6 etapas: "Vista frontal completa do conjunto", "Lateral esquerda completa", "Lateral direita completa", "Traseira completa", "Posição dos eixos", "Pneus detalhe (mínimo 4 fotos)"
4. WHEN o modelo "Carreta Rodotrem Graneleiro" é selecionado, THEN the Sistema SHALL carregar sequência com 7 etapas: as 6 etapas do "Carreta Rodotrem 9 Eixos" mais "Detalhe da lona ou tampa superior"
5. WHEN uma sequência é carregada, THEN the Sistema SHALL manter a ordem das etapas conforme especificado

### Requirement 7

**User Story:** Como vendedor, eu quero uma interface visual clara e acessível durante a vistoria, para que eu possa completar o processo de forma eficiente.

#### Acceptance Criteria

1. WHEN a interface de vistoria guiada é exibida, THEN the Sistema SHALL utilizar design flat com fundo branco
2. WHEN a interface de vistoria guiada é exibida, THEN the Sistema SHALL utilizar fonte Poppins em todos os textos
3. WHEN botões de ação são exibidos, THEN the Sistema SHALL apresentar botões grandes com altura mínima de 48 pixels
4. WHEN instruções são exibidas, THEN the Sistema SHALL posicionar o texto de instrução de forma visível acima ou ao lado da imagem ilustrativa
5. WHEN o vendedor navega entre etapas, THEN the Sistema SHALL exibir indicador de progresso mostrando etapa atual e total de etapas
6. WHEN uma foto é capturada, THEN the Sistema SHALL exibir feedback visual de sucesso

### Requirement 8

**User Story:** Como vendedor, eu quero poder revisar e substituir fotos antes de finalizar a vistoria, para corrigir imagens que não ficaram adequadas.

#### Acceptance Criteria

1. WHEN uma foto já foi capturada em uma etapa, THEN the Sistema SHALL exibir a foto atual com opção "Substituir Foto"
2. WHEN o vendedor clica em "Substituir Foto", THEN the Sistema SHALL permitir nova captura ou seleção da galeria
3. WHEN uma nova foto é capturada para substituição, THEN the Sistema SHALL substituir a foto anterior mantendo o mesmo label
4. WHEN o vendedor volta para uma etapa anterior, THEN the Sistema SHALL exibir a foto já capturada naquela etapa
5. WHEN a vistoria é concluída, THEN the Sistema SHALL utilizar apenas as fotos mais recentes de cada etapa

### Requirement 9

**User Story:** Como sistema, eu preciso validar o formato e qualidade das fotos enviadas, para garantir que as imagens são adequadas para análise.

#### Acceptance Criteria

1. WHEN uma foto é selecionada ou capturada, THEN the Sistema SHALL verificar se o formato é JPEG, PNG ou WebP
2. WHEN uma foto possui formato inválido, THEN the Sistema SHALL rejeitar o upload e exibir mensagem de erro
3. WHEN uma foto é maior que 10MB, THEN the Sistema SHALL comprimir a imagem antes do upload
4. WHEN uma foto é capturada pela câmera, THEN the Sistema SHALL preservar os metadados EXIF quando possível
5. WHEN o upload de uma foto falha, THEN the Sistema SHALL exibir mensagem de erro e permitir nova tentativa

### Requirement 10

**User Story:** Como gerente, eu quero visualizar as fotos da vistoria organizadas por etapa, para facilitar a análise e aprovação das inspeções.

#### Acceptance Criteria

1. WHEN um gerente visualiza uma vistoria concluída, THEN the Sistema SHALL exibir as fotos organizadas por label na ordem da sequência
2. WHEN as fotos são exibidas, THEN the Sistema SHALL mostrar o label de cada foto como legenda
3. WHEN uma vistoria no modo "Livre" é visualizada, THEN the Sistema SHALL exibir todas as fotos em ordem cronológica
4. WHEN o gerente clica em uma foto, THEN the Sistema SHALL exibir a imagem em tamanho completo
5. WHEN uma vistoria guiada é visualizada, THEN the Sistema SHALL indicar visualmente qual modelo de vistoria foi utilizado
