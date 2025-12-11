import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const logoSizes = {
    sm: 'h-12',
    md: 'h-20',
    lg: 'h-32',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img 
        src="/logo SR.png" 
        alt="SR Caminhões Logo" 
        className={cn('object-contain', logoSizes[size])}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold text-foreground leading-tight', textSizes[size])}>
            SR Caminhões
          </span>
          <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
            Sistema de Vistorias
          </span>
        </div>
      )}
    </div>
  );
}
