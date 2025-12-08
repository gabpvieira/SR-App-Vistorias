import { Helmet } from 'react-helmet-async';

/**
 * Componente para bloquear indexação de páginas internas
 * Adiciona meta tags que impedem crawlers de indexar o conteúdo
 */
export function NoIndexMeta({ title = 'Sistema Interno' }: { title?: string }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      <meta name="bingbot" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
      <meta name="description" content="Acesso restrito" />
    </Helmet>
  );
}
