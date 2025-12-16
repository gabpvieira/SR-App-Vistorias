/**
 * Step Feedback Buttons Component
 * Allows clients to approve, reject or hide inspection steps
 */

import { useState } from 'react';
import { Check, X, EyeOff, MessageSquare, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { cn } from '../lib/utils';
import type { FeedbackStatus } from '../types/feedback';

interface StepFeedbackButtonsProps {
  etapaId: string;
  etapaLabel: string;
  currentStatus: FeedbackStatus | null;
  currentComment: string | null;
  onApprove: (etapaId: string, etapaLabel: string, comentario?: string) => Promise<void>;
  onReject: (etapaId: string, etapaLabel: string, comentario?: string) => Promise<void>;
  onHide: (etapaId: string, etapaLabel: string, comentario?: string) => Promise<void>;
  onReset?: (feedbackId: string) => Promise<void>;
  feedbackId?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function StepFeedbackButtons({
  etapaId,
  etapaLabel,
  currentStatus,
  currentComment,
  onApprove,
  onReject,
  onHide,
  onReset,
  feedbackId,
  disabled = false,
  compact = false
}: StepFeedbackButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [comment, setComment] = useState(currentComment || '');
  const [showComment, setShowComment] = useState(false);

  const handleAction = async (
    action: 'approve' | 'reject' | 'hide' | 'reset',
    handler: () => Promise<void>
  ) => {
    setLoading(action);
    try {
      await handler();
      if (action !== 'reset') {
        setShowComment(false);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const statusColors: Record<FeedbackStatus, string> = {
    approved: 'bg-green-100 border-green-500 text-green-700',
    rejected: 'bg-red-100 border-red-500 text-red-700',
    hidden: 'bg-gray-100 border-gray-500 text-gray-700',
    pending: 'bg-yellow-100 border-yellow-500 text-yellow-700'
  };

  const statusLabels: Record<FeedbackStatus, string> = {
    approved: 'Aprovado',
    rejected: 'Reprovado',
    hidden: 'Oculto',
    pending: 'Pendente'
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={currentStatus === 'approved' ? 'default' : 'outline'}
          className={cn(
            'h-7 w-7 p-0',
            currentStatus === 'approved' && 'bg-green-600 hover:bg-green-700'
          )}
          onClick={() => handleAction('approve', () => onApprove(etapaId, etapaLabel, comment))}
          disabled={disabled || loading !== null}
          title="Aprovar etapa"
        >
          {loading === 'approve' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant={currentStatus === 'rejected' ? 'default' : 'outline'}
          className={cn(
            'h-7 w-7 p-0',
            currentStatus === 'rejected' && 'bg-red-600 hover:bg-red-700'
          )}
          onClick={() => handleAction('reject', () => onReject(etapaId, etapaLabel, comment))}
          disabled={disabled || loading !== null}
          title="Reprovar etapa"
        >
          {loading === 'reject' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </Button>
        
        <Button
          size="sm"
          variant={currentStatus === 'hidden' ? 'default' : 'outline'}
          className={cn(
            'h-7 w-7 p-0',
            currentStatus === 'hidden' && 'bg-gray-600 hover:bg-gray-700'
          )}
          onClick={() => handleAction('hide', () => onHide(etapaId, etapaLabel, comment))}
          disabled={disabled || loading !== null}
          title="Ocultar etapa"
        >
          {loading === 'hide' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <EyeOff className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      {currentStatus && currentStatus !== 'pending' && (
        <div className={cn(
          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
          statusColors[currentStatus]
        )}>
          {currentStatus === 'approved' && <Check className="h-3 w-3" />}
          {currentStatus === 'rejected' && <X className="h-3 w-3" />}
          {currentStatus === 'hidden' && <EyeOff className="h-3 w-3" />}
          {statusLabels[currentStatus]}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={currentStatus === 'approved' ? 'default' : 'outline'}
          className={cn(
            currentStatus === 'approved' && 'bg-green-600 hover:bg-green-700'
          )}
          onClick={() => handleAction('approve', () => onApprove(etapaId, etapaLabel, comment))}
          disabled={disabled || loading !== null}
        >
          {loading === 'approve' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Aprovar
        </Button>
        
        <Button
          size="sm"
          variant={currentStatus === 'rejected' ? 'default' : 'outline'}
          className={cn(
            currentStatus === 'rejected' && 'bg-red-600 hover:bg-red-700'
          )}
          onClick={() => handleAction('reject', () => onReject(etapaId, etapaLabel, comment))}
          disabled={disabled || loading !== null}
        >
          {loading === 'reject' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-1" />
          )}
          Reprovar
        </Button>
        
        <Button
          size="sm"
          variant={currentStatus === 'hidden' ? 'default' : 'outline'}
          className={cn(
            currentStatus === 'hidden' && 'bg-gray-600 hover:bg-gray-700'
          )}
          onClick={() => handleAction('hide', () => onHide(etapaId, etapaLabel, comment))}
          disabled={disabled || loading !== null}
        >
          {loading === 'hide' ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <EyeOff className="h-4 w-4 mr-1" />
          )}
          Ocultar
        </Button>

        {/* Comment Popover */}
        <Popover open={showComment} onOpenChange={setShowComment}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className={cn(currentComment && 'text-blue-600')}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              {currentComment ? 'Editar' : 'Comentar'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <p className="text-sm font-medium">Comentário (opcional)</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Deixe um comentário sobre esta etapa..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                O comentário será salvo junto com sua avaliação
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Reset Button */}
        {currentStatus && currentStatus !== 'pending' && onReset && feedbackId && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAction('reset', () => onReset(feedbackId))}
            disabled={disabled || loading !== null}
          >
            {loading === 'reset' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-1" />
            )}
            Resetar
          </Button>
        )}
      </div>

      {/* Current Comment Display */}
      {currentComment && (
        <div className="mt-2 p-2 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground mb-1">Seu comentário:</p>
          <p className="text-sm">{currentComment}</p>
        </div>
      )}
    </div>
  );
}
