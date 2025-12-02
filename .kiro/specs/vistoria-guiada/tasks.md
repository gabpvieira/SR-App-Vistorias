# Implementation Plan - Vistoria Guiada por Tipo de Veículo

- [x] 1. Configurar estrutura de dados e tipos




  - Criar enums e interfaces TypeScript para modelos de veículos, etapas e fotos
  - Definir tipos para estados de captura e upload
  - Criar constantes para sequências de etapas de cada modelo
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 1.1 Write property test for vehicle model options






  - **Property 2: Modelo de vistoria tem exatamente 5 opções**
  - **Validates: Requirements 1.2**

- [x] 1.2 Write property test for step sequences






  - **Property 14: Cavalo 6x4 tem 7 etapas específicas**
  - **Property 15: Cavalo 6x2 equivale a Cavalo 6x4**
  - **Property 16: Rodotrem 9 Eixos tem 6 etapas específicas**
  - **Property 17: Graneleiro adiciona etapa de lona**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 2. Implementar serviço de fotos




  - Criar PhotoService com métodos para upload, compressão e validação
  - Implementar validação de formato de arquivo (JPEG, PNG, WebP)
  - Implementar compressão para arquivos maiores que 10MB
  - Implementar geração de path estruturado para Supabase Storage
  - Implementar preservação de metadados EXIF
  - _Requirements: 4.3, 9.1, 9.2, 9.3, 9.4_

- [x] 2.1 Write property test for photo format validation






  - **Property 23: Validação aceita formatos suportados**
  - **Property 24: Validação rejeita formatos não suportados**
  - **Validates: Requirements 9.1, 9.2**

- [x] 2.2 Write property test for photo compression






  - **Property 25: Imagens grandes são comprimidas**
  - **Validates: Requirements 9.3**

- [x] 2.3 Write property test for storage path generation






  - **Property 11: Path de storage segue padrão estruturado**
  - **Validates: Requirements 4.3**

- [x] 2.4 Write property test for photo metadata






  - **Property 10: Foto salva tem metadados completos**
  - **Validates: Requirements 4.1, 4.2, 4.4, 4.5**

- [x] 3. Criar componente VehicleModelSelector




  - Implementar UI de seleção com 5 opções de modelo
  - Adicionar validação de campo obrigatório
  - Implementar lógica para exibir apenas em vistorias de troca
  - Adicionar estilos seguindo design system (Poppins, flat design)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 3.1 Write property test for model field visibility
  - **Property 1: Vistoria de Troca sempre exibe campo de modelo**
  - **Property 3: Vistoria de Manutenção omite campo de modelo**
  - **Validates: Requirements 1.1, 1.4**

- [ ] 4. Implementar lógica de sequência de etapas
  - Criar função getStepsForModel() que retorna etapas baseadas no modelo
  - Implementar carregamento de ilustrações e instruções para cada etapa
  - Garantir ordem correta das etapas
  - Adicionar suporte para etapas obrigatórias vs opcionais
  - _Requirements: 2.1, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 4.1 Write property test for step loading
  - **Property 4: Modelo guiado carrega sequência de etapas**
  - **Property 5: Toda etapa tem ilustração e instruções**
  - **Validates: Requirements 2.1, 2.2, 2.3, 6.5**

- [ ] 5. Criar componente InspectionStepCard
  - Implementar UI de etapa individual com ilustração e instruções
  - Adicionar botões "Tirar Foto" e "Selecionar da Galeria"
  - Implementar preview de foto capturada
  - Adicionar botões de navegação (Voltar, Próxima, Concluir)
  - Implementar indicador de progresso (ex: "3 de 7")
  - Garantir altura mínima de 48px para botões
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 7.3, 7.5_

- [ ]* 5.1 Write property test for step UI elements
  - **Property 6: Etapa fornece opções de captura**
  - **Property 18: Botões têm altura mínima acessível**
  - **Validates: Requirements 2.4, 7.3**

- [ ]* 5.2 Write property test for navigation state
  - **Property 7: Foto capturada habilita navegação**
  - **Property 19: Indicador de progresso reflete etapa atual**
  - **Validates: Requirements 2.6, 2.9, 7.5**

- [ ] 6. Implementar componente GuidedInspectionFlow
  - Criar gerenciador de estado para fluxo completo
  - Implementar navegação entre etapas com preservação de estado
  - Adicionar lógica de captura e armazenamento temporário de fotos
  - Implementar funcionalidade de substituição de fotos
  - Garantir que fotos mais recentes sejam usadas na conclusão
  - _Requirements: 2.7, 2.8, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 6.1 Write property test for state preservation
  - **Property 8: Navegação preserva progresso**
  - **Property 21: Substituição mantém label original**
  - **Property 22: Conclusão usa fotos mais recentes**
  - **Validates: Requirements 2.7, 2.8, 8.3, 8.4, 8.5**

- [ ]* 6.2 Write property test for photo replacement
  - **Property 20: Etapa com foto permite substituição**
  - **Validates: Requirements 8.1**

- [ ] 7. Implementar validação de completude
  - Criar função validateInspectionComplete() que verifica todas etapas obrigatórias
  - Implementar lógica para impedir conclusão com etapas pendentes
  - Adicionar exibição de lista de etapas pendentes
  - Permitir conclusão apenas quando todas etapas estão completas
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 7.1 Write property test for completion validation
  - **Property 12: Vistoria guiada requer todas as etapas**
  - **Property 13: Vistoria completa permite conclusão**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 8. Criar componente FreeUploadMode
  - Implementar interface de upload livre sem etapas
  - Adicionar botão "Adicionar Foto" com upload ilimitado
  - Implementar funcionalidade de remoção de fotos individuais
  - Permitir conclusão com qualquer quantidade de fotos
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 8.1 Write property test for free mode
  - **Property 9: Modo Livre permite upload ilimitado**
  - **Validates: Requirements 3.4, 3.6**

- [ ] 9. Implementar integração com Supabase Storage
  - Configurar upload de fotos para Supabase Storage
  - Implementar geração de URLs públicas para fotos
  - Adicionar tratamento de erros de upload (rede, quota, etc)
  - Implementar retry logic para falhas recuperáveis
  - Salvar metadados de fotos no banco de dados
  - _Requirements: 4.3, 4.4, 4.5, 5.4, 9.5_

- [ ]* 9.1 Write property test for upload error handling
  - **Property 26: Fotos são ordenadas por label na visualização** (parcial)
  - **Validates: Requirements 9.5**

- [ ] 10. Atualizar página NewInspection
  - Integrar VehicleModelSelector na criação de vistoria de troca
  - Adicionar roteamento condicional para fluxo guiado vs livre
  - Implementar salvamento de vehicleModel na vistoria
  - Adicionar flags isGuidedInspection e guidedPhotosComplete
  - _Requirements: 1.1, 1.4_

- [ ] 11. Implementar visualização de fotos para gerentes
  - Criar componente de galeria organizada por etapas
  - Implementar ordenação por label para vistorias guiadas
  - Implementar ordenação cronológica para modo livre
  - Adicionar visualização em tamanho completo ao clicar
  - Exibir modelo de vistoria utilizado
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 11.1 Write property test for photo ordering
  - **Property 26: Fotos são ordenadas por label na visualização**
  - **Property 27: Modo Livre ordena por timestamp**
  - **Validates: Requirements 10.1, 10.3**

- [ ] 12. Adicionar ilustrações e assets
  - Criar ou obter ilustrações para cada etapa de cada modelo
  - Otimizar imagens para web (formato, tamanho)
  - Adicionar ilustrações ao projeto em /public/illustrations
  - Configurar URLs de ilustrações nas definições de etapas
  - _Requirements: 2.2_

- [ ] 13. Implementar tratamento de erros e feedback
  - Adicionar mensagens de erro para falhas de upload
  - Implementar feedback visual de sucesso ao capturar foto
  - Adicionar tratamento de permissões de câmera/galeria
  - Implementar mensagens de validação claras
  - Adicionar loading states durante uploads
  - _Requirements: 9.5, 7.6_

- [ ] 14. Checkpoint - Garantir que todos os testes passam
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Aplicar estilos e polish de UI
  - Aplicar design flat com fundo branco
  - Configurar fonte Poppins em toda interface
  - Garantir botões grandes e acessíveis (min 48px)
  - Adicionar animações suaves de transição
  - Implementar design responsivo para mobile
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 15.1 Write integration test for complete flow
  - Test full workflow from model selection to completion
  - Verify all photos are saved correctly
  - Test navigation and state persistence

- [ ] 16. Final Checkpoint - Validação completa
  - Ensure all tests pass, ask the user if questions arise.
