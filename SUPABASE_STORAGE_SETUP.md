# Configuração do Storage no Supabase

## Criar Bucket de Fotos

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard/project/hppdjdnnovtxtiwawtsh

2. Vá em **Storage** no menu lateral

3. Clique em **New bucket**

4. Configure o bucket:
   - **Name**: `inspection-photos`
   - **Public bucket**: ✅ Marque como público (para URLs públicas das fotos)
   - Clique em **Create bucket**

## Configurar Políticas de Acesso

Após criar o bucket, configure as políticas de acesso:

1. Clique no bucket `inspection-photos`
2. Vá na aba **Policies**
3. Clique em **New Policy**
4. Selecione **For full customization**

### Política 1: Permitir Upload (INSERT)
```sql
CREATE POLICY "Allow all uploads to inspection-photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'inspection-photos');
```

### Política 2: Permitir Leitura (SELECT)
```sql
CREATE POLICY "Allow all reads from inspection-photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'inspection-photos');
```

### Política 3: Permitir Deleção (DELETE)
```sql
CREATE POLICY "Allow all deletes from inspection-photos"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'inspection-photos');
```

## Estrutura de Pastas

As fotos serão organizadas automaticamente por vistoria:
```
inspection-photos/
  └── inspections/
      └── {inspection-id}/
          ├── 1-Frontal_45.jpg
          ├── 2-Frente_reta.jpg
          └── ...
```

## Verificar Configuração

Após configurar, teste o upload através do componente `SupabaseTest.tsx` no app.

## Limites e Quotas

- **Free tier**: 1 GB de storage
- **Tamanho máximo por arquivo**: 50 MB (padrão)
- **Formatos suportados**: JPG, PNG, WEBP

Para aumentar limites, considere upgrade do plano no Supabase.
