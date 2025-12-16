/**
 * Step Feedback Wrapper Component
 * Wraps inspection steps with feedback functionality
 * Shows feedback buttons and hides steps that were marked as hidden
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { StepFeedbackButtons } from './StepFeedbackButtons';
import { useFeedback } from '../hooks/useFeedback';
import { cn } from '../lib/utils';
import type { VistoriaTipo } from '../types/feedback';

interface StepFeedbackWrapperProps {
  userId: string;
  vistoriaTipo: VistoriaTipo;
  etapaId: string;
  etapaLabel: string;
  children: React.ReactNode;
  showFeedbackControls?: boolean;
  className?: string;
}

export function StepFeedbackWrapper({
  userId,
  vistoriaTipo,
  etapaId,
  etapaLabel,
  children,
  showFeedbackControls = true,
  className
}: StepFeedbackWrapperProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  
  const {
    feedbacks,
    isStepHidden,
    getStepStatus,
    getStepComment,
    approveStep,
    rejectStep,
    hideStep,
    resetStepFeedback
  } = useFeedback({
    userId,
    vistoriaTipo,
    autoLoad: true
  });

  // Se a etapa está oculta, não renderiza
  if (isStepHidden(etapaId)) {
    return null;
  }

  const currentStatus = getStepStatus(etapaId);
  const currentComment = getStepComment(etapaId);
  const feedback = feedbacks.find(f => f.etapa_id === etapaId);

  // Status indicator colors
  const statusIndicator = currentStatus && currentStatus !== 'pending' ? (
    <div className={cn(
      'absolute top-2 right-2 w-3 h-3 rounded-full',
      currentStatus === 'approved' && 'bg-green-500',
      currentStatus === 'rejected' && 'bg-red-500',
      currentStatus === 'hidden' && 'bg-gray-500'
    )} />
  ) : null;

  if (!showFeedbackControls) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative', className)}>
      {statusIndicator}
      
      {children}
      
      {/* Feedback Toggle Button */}
      <div className="mt-3 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFeedback(!showFeedback)}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Avaliar esta etapa
            {currentStatus && currentStatus !== 'pending' && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                currentStatus === 'approved' && 'bg-green-100 text-green-700',
                currentStatus === 'rejected' && 'bg-red-100 text-red-700'
              )}>
                {currentStatus === 'approved' ? 'Aprovado' : 'Reprovado'}
              </span>
            )}
          </span>
          {showFeedback ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {showFeedback && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <StepFeedbackButtons
              etapaId={etapaId}
              etapaLabel={etapaLabel}
              currentStatus={currentStatus}
              currentComment={currentComment}
              onApprove={approveStep}
              onReject={rejectStep}
              onHide={hideStep}
              onReset={resetStepFeedback}
              feedbackId={feedback?.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to filter steps based on hidden feedback
 */
export function useFilteredSteps<T extends { id: string }>(
  steps: T[],
  userId: string,
  vistoriaTipo: VistoriaTipo
): { filteredSteps: T[]; hiddenCount: number; loading: boolean } {
  const { hiddenSteps, loading } = useFeedback({
    userId,
    vistoriaTipo,
    autoLoad: true
  });

  const filteredSteps = steps.filter(step => !hiddenSteps.includes(step.id));
  const hiddenCount = steps.length - filteredSteps.length;

  return { filteredSteps, hiddenCount, loading };
}
