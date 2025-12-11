/**
 * Gera URL de thumbnail do Supabase Storage
 * Usa a API de transformação de imagens para gerar thumbnails on-the-fly
 * A imagem original permanece intacta no storage
 */
export function getThumbnailUrl(
  originalUrl: string,
  width: number = 400,
  quality: number = 60
): string {
  if (!originalUrl) return '';
  
  // Verificar se é URL do Supabase
  if (!originalUrl.includes('supabase.co/storage')) {
    return originalUrl;
  }

  try {
    // Formato da URL do Supabase Storage:
    // https://xxx.supabase.co/storage/v1/object/public/bucket/path
    // 
    // Para transformação (thumbnail):
    // https://xxx.supabase.co/storage/v1/render/image/public/bucket/path?width=X&quality=Y
    
    const url = new URL(originalUrl);
    
    // Substituir /object/ por /render/image/
    const newPath = url.pathname.replace('/storage/v1/object/', '/storage/v1/render/image/');
    url.pathname = newPath;
    
    // Adicionar parâmetros de transformação
    url.searchParams.set('width', width.toString());
    url.searchParams.set('quality', quality.toString());
    
    return url.toString();
  } catch {
    return originalUrl;
  }
}
