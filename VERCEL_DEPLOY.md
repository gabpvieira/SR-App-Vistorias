# Deploy na Vercel - SR App Vistorias

## Configuração Rápida

### 1. Importar Projeto na Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório: `gabpvieira/SR-App-Vistorias`
4. Configure as variáveis de ambiente abaixo

### 2. Variáveis de Ambiente

Copie e cole estas variáveis na seção "Environment Variables" da Vercel:

```
VITE_SUPABASE_URL=https://hppdjdnnovtxtiwawtsh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcGRqZG5ub3Z0eHRpd2F3dHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTI4NjQsImV4cCI6MjA4MDI2ODg2NH0.1r-rLq7bX8NX2_F8UcKBSAq9_MYU9xkrxPxXWy4L5E8
```

### 3. Configurações do Build

A Vercel detectará automaticamente as configurações do Vite através do `vercel.json`:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Deploy

Clique em "Deploy" e aguarde o build finalizar.

## Configuração Pós-Deploy

### Atualizar URLs no Supabase

Após o deploy, adicione a URL da Vercel nas configurações do Supabase:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Authentication** > **URL Configuration**
3. Adicione sua URL da Vercel em:
   - **Site URL**: `https://seu-app.vercel.app`
   - **Redirect URLs**: `https://seu-app.vercel.app/**`

### Domínio Customizado (Opcional)

Na Vercel, vá em **Settings** > **Domains** para adicionar um domínio personalizado.

## Comandos Úteis

```bash
# Instalar Vercel CLI (opcional)
npm i -g vercel

# Deploy via CLI
vercel

# Deploy em produção
vercel --prod
```

## Troubleshooting

### Erro de Roteamento
Se as rotas não funcionarem, verifique se o `vercel.json` está configurado corretamente com os rewrites.

### Variáveis de Ambiente
Certifique-se de que todas as variáveis começam com `VITE_` para serem expostas no build do Vite.

### Build Falhou
Verifique os logs de build na Vercel e certifique-se de que todas as dependências estão no `package.json`.
