# 🔐 Configuração de Autenticação de Usuários

## ⚠️ Importante: Configuração Manual Necessária

O sistema de gerenciamento de usuários foi implementado, mas requer configuração adicional no Supabase para funcionar completamente.

## 📋 O que foi configurado automaticamente

✅ Políticas RLS (Row Level Security) na tabela `users`
✅ Funções SQL para criar e deletar usuários
✅ Índices para melhor performance
✅ Interface de gerenciamento completa

## 🔧 Configuração Manual Necessária

### Opção 1: Usar Supabase Auth (Recomendado)

Para que os usuários possam fazer login com as credenciais criadas pelo administrador, você precisa:

#### 1. Criar uma Edge Function para Registro

Crie um arquivo `supabase/functions/create-user/index.ts`:

\`\`\`typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { email, password, name, role } = await req.json()

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) throw authError

    // Create user in database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role
      })

    if (dbError) throw dbError

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
\`\`\`

#### 2. Deploy a Edge Function

\`\`\`bash
supabase functions deploy create-user
\`\`\`

#### 3. Atualizar o código frontend

Modifique `src/lib/supabase-queries.ts`:

\`\`\`typescript
export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role: 'vendedor' | 'gerente';
}) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: userData
  });

  if (error) throw error;
  if (data.error) throw new Error(data.error);
  
  return data.user;
}
\`\`\`

### Opção 2: Sistema de Convite por E-mail

Alternativamente, você pode usar o sistema de convite do Supabase:

1. **No Dashboard do Supabase**:
   - Vá em Authentication > Users
   - Clique em "Invite User"
   - Digite o e-mail
   - O usuário receberá um link para definir a senha

2. **Após o usuário aceitar o convite**:
   - O administrador pode atualizar o role na tabela `users`

### Opção 3: Autenticação Simplificada (Atual)

O sistema atual cria registros na tabela `users`, mas não cria contas no Supabase Auth. Isso significa:

- ✅ Você pode gerenciar usuários na interface
- ✅ Pode ver a lista de usuários
- ✅ Pode deletar usuários
- ❌ Usuários não podem fazer login (ainda)

Para habilitar login, escolha a Opção 1 ou 2 acima.

## 🔒 Políticas de Segurança Configuradas

### Tabela `users`

1. **SELECT**: Usuários podem ver seus próprios dados OU gerentes podem ver todos
2. **INSERT**: Apenas gerentes podem inserir
3. **UPDATE**: Apenas gerentes podem atualizar
4. **DELETE**: Apenas gerentes podem deletar

### Funções SQL Criadas

- `create_new_user()`: Cria usuário (apenas gerentes)
- `delete_user_by_id()`: Deleta usuário (apenas gerentes)

## 📝 Próximos Passos

1. **Escolha uma das opções acima** para habilitar autenticação completa
2. **Teste a criação de usuário** através da interface
3. **Teste o login** com as credenciais criadas
4. **Configure e-mail templates** (opcional) no Supabase Dashboard

## 🆘 Solução Temporária

Se você precisa testar o sistema agora, pode:

1. Criar usuários manualmente no Supabase Dashboard (Authentication > Users)
2. Depois, adicionar os dados na tabela `users` com o mesmo ID
3. Usar a interface para gerenciar os usuários existentes

## 📚 Documentação Útil

- [Supabase Auth Admin](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Status Atual**: ✅ Interface pronta | ⚠️ Requer configuração de Auth
**Recomendação**: Implementar Opção 1 (Edge Function) para funcionalidade completa
