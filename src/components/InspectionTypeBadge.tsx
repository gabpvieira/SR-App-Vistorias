import { cn } from '@/lib/utils';

interface InspectionTypeBadgeProps {
  type: 'troca' | 'manutencao';
  size?: 'sm' | 'md';
}

export function InspectionTypeBadge({ type, size = 'md' }: InspectionTypeBadgeProps) {
  const isExchange = type === 'troca';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded',
        sizeClasses[size],
        isExchange
          ? 'bg-primary text-primary-foreground'
          : 'bg-warning text-warning-foreground'
      )}
    >
      {isExchange ? 'Troca' : 'Manutenção'}
    </span>
  );
}
