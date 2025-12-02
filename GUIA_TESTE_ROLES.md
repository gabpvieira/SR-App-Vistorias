# 🧪 Guia de Teste - Funcionalidade de Roles

## 📋 Pré-requisitos
- Banco de dados Supabase configurado
- Seed executado (`supabase-seed.sql`)
- Aplicação rodando localmente

## 👥 Usuários de Teste

### Gerentes (Administradores)
```
Email: gerente1@example.com
Nome: Carlos Oliveira
Role: gerente
Senha: qualquer senha com 8+ caracteres (ex: 12345678)

Email: gerente2@example.com
Nome: Ana Costa
Role: gerente
Senha: qualquer senha com 8+ caracteres (ex: 12345678)
```

### Vendedores
```
Email: vendedor1@example.com
Nome: João Silva
Role: vendedor
Senha: qualquer senha com 8+ caracteres (ex: 12345678)

Email: vendedor2@example.com
Nome: Maria Santos
Role: vendedor
Senha: qualquer senha com 8+ caracteres (ex: 12345678)
```

## 🧪 Casos de Teste

### Teste 1: Login como Gerente
1. Acesse `/login/gerente`
2. Entre com `gerente1@example.com` / `12345678`
3. ✅ Deve redirecionar para `/dashboard`
4. ✅ Deve exibir "Olá, Carlos!" na saudação
5. ✅ Deve exibir "Painel do Administrador" no header
6. ✅ Deve exibir data e hora atualizadas em tempo real
7. ✅ Deve mostrar filtro "Vendedor" nos filtros

### Teste 2: Login como Vendedor
1. Acesse `/login/vendedor`
2. Entre com `vendedor1@example.com` / `12345678`
3. ✅ Deve redirecionar para `/dashboard`
4. ✅ Deve exibir "Olá, João!" na saudação
5. ✅ Deve exibir "Painel do Vendedor" no header
6. ✅ Deve exibir data e hora atualizadas em tempo real
7. ✅ NÃO deve mostrar filtro "Vendedor" nos filtros

### Teste 3: Criar Vistorias como Vendedor
1. Login como `vendedor1@example.com`
2. Crie 3 vistorias diferentes
3. ✅ Deve conseguir criar normalmente
4. ✅ Deve ver as 3 vistorias no dashboard
5. Faça logout e login como `vendedor2@example.com`
6. ✅ NÃO deve ver as vistorias do vendedor1
7. ✅ Dashboard deve estar vazio ou mostrar apenas vistorias do vendedor2

### Teste 4: Visualizar Todas as Vistorias como Gerente
1. Login como `gerente1@example.com`
2. ✅ Deve ver TODAS as vistorias do sistema
3. ✅ Deve ver vistorias de vendedor1 e vendedor2
4. Use o filtro "Vendedor"
5. Selecione "João Silva"
6. ✅ Deve mostrar apenas vistorias do João
7. Selecione "Maria Santos"
8. ✅ Deve mostrar apenas vistorias da Maria
9. Selecione "Todos os vendedores"
10. ✅ Deve mostrar todas as vistorias novamente

### Teste 5: Deletar Vistoria como Gerente
1. Login como `gerente1@example.com`
2. Abra uma vistoria qualquer
3. ✅ Deve ter botão "Deletar Vistoria"
4. Clique em deletar
5. ✅ Deve mostrar confirmação
6. Confirme
7. ✅ Vistoria deve ser removida

### Teste 6: Tentar Deletar como Vendedor
1. Login como `vendedor1@example.com`
2. Abra uma de suas vistorias
3. ✅ NÃO deve ter botão "Deletar Vistoria"
4. ✅ Ou botão deve estar desabilitado/oculto

### Teste 7: Saudação Dinâmica
1. Login com qualquer usuário
2. ✅ Verifique se o primeiro nome está correto
3. ✅ Verifique se a data está em português
4. ✅ Verifique se a hora está atualizando a cada segundo
5. ✅ Formato esperado: "terça-feira, 02 de dezembro de 2025, 14:37"

### Teste 8: Proteção de Rotas
1. Faça logout
2. Tente acessar `/dashboard` diretamente
3. ✅ Deve redirecionar para `/`
4. Login como vendedor
5. Tente acessar rotas de gerente (se houver)
6. ✅ Deve redirecionar para `/dashboard`

### Teste 9: Filtros no Dashboard
1. Login como gerente com várias vistorias
2. Teste filtro por Tipo:
   - ✅ "Todos os tipos" - mostra todas
   - ✅ "Troca" - mostra apenas trocas
   - ✅ "Manutenção" - mostra apenas manutenções
3. Teste filtro por Período:
   - ✅ "Todo período" - mostra todas
   - ✅ "Última semana" - mostra apenas da última semana
   - ✅ "Último mês" - mostra apenas do último mês
4. Teste busca por placa:
   - ✅ Digite uma placa parcial
   - ✅ Deve filtrar em tempo real

### Teste 10: Responsividade
1. Teste em desktop (> 1024px)
   - ✅ Filtros devem estar visíveis
   - ✅ "Painel do Administrador/Vendedor" deve estar visível
2. Teste em tablet (768px - 1024px)
   - ✅ Layout deve se adaptar
3. Teste em mobile (< 768px)
   - ✅ Filtros devem estar em menu colapsável
   - ✅ Logo deve ser compacta
   - ✅ Menu hamburguer deve funcionar

## 🐛 Problemas Conhecidos
Nenhum problema conhecido no momento.

## ✅ Checklist de Funcionalidades

### Saudação Dinâmica
- [x] Exibe primeiro nome do usuário
- [x] Exibe data formatada em português
- [x] Exibe hora atualizada em tempo real
- [x] Design flat com borda sólida

### Header
- [x] Exibe "Painel do Administrador" para gerentes
- [x] Exibe "Painel do Vendedor" para vendedores
- [x] Logo alterada para `midia/logo SR.png`

### Dashboard
- [x] Saudação no topo
- [x] Filtro por vendedor apenas para gerentes
- [x] Vendedores veem apenas suas vistorias
- [x] Gerentes veem todas as vistorias

### Permissões
- [x] Vendedores não podem deletar vistorias
- [x] Vendedores não veem vistorias de outros
- [x] Gerentes podem deletar vistorias
- [x] Gerentes podem filtrar por vendedor

### Segurança
- [x] Rotas protegidas
- [x] Verificação de role
- [x] Filtragem no backend
- [x] RLS no Supabase

## 📊 Resultados Esperados

### Para Gerente
- Ver todas as vistorias: ✅
- Filtrar por vendedor: ✅
- Deletar vistorias: ✅
- Saudação personalizada: ✅
- Indicador "Painel do Administrador": ✅

### Para Vendedor
- Ver apenas suas vistorias: ✅
- Criar vistorias: ✅
- Não ver filtro de vendedor: ✅
- Não deletar vistorias: ✅
- Saudação personalizada: ✅
- Indicador "Painel do Vendedor": ✅

## 🎯 Próximos Testes
- [ ] Teste de carga com muitos usuários
- [ ] Teste de performance com muitas vistorias
- [ ] Teste de segurança (tentativas de bypass)
- [ ] Teste de acessibilidade
- [ ] Teste em diferentes navegadores
