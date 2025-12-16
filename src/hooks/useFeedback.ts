/**
 * React Hook for Feature Feedback System
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getUserFeedbacks,
  getHiddenSteps,
  upsertFeedback,
  resetFeedback,
  clearFeedbackCache
} from '../lib/feedback-service';
import type {
  FeatureFeedback,
  FeedbackStatus,
  VistoriaTipo,
  CreateFeedbackInput
} from '../types/feedback';

interface UseFeedbackOptions {
  userId: string;
  vistoriaTipo?: VistoriaTipo;
  autoLoad?: boolean;
}

interface UseFeedbackReturn {
  feedbacks: FeatureFeedback[];
  hiddenSteps: string[];
  loading: boolean;
  error: string | null;
  
  // Actions
  submitFeedback: (input: CreateFeedbackInput) => Promise<void>;
  approveStep: (etapaId: string, etapaLabel: string, comentario?: string) => Promise<void>;
  rejectStep: (etapaId: string, etapaLabel: string, comentario?: string) => Promise<void>;
  hideStep: (etapaId: string, etapaLabel: string, comentario?: string) => Promise<void>;
  resetStepFeedback: (feedbackId: string) => Promise<void>;
  isStepHidden: (etapaId: string) => boolean;
  getStepStatus: (etapaId: string) => FeedbackStatus | null;
  getStepComment: (etapaId: string) => string | null;
  refresh: () => Promise<void>;
}

export function useFeedback({
  userId,
  vistoriaTipo,
  autoLoad = true
}: UseFeedbackOptions): UseFeedbackReturn {
  const [feedbacks, setFeedbacks] = useState<FeatureFeedback[]>([]);
  const [hiddenSteps, setHiddenSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeedbacks = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [userFeedbacks, hidden] = await Promise.all([
        getUserFeedbacks(userId, vistoriaTipo ? { vistoria_tipo: vistoriaTipo } : undefined),
        vistoriaTipo ? getHiddenSteps(userId, vistoriaTipo) : Promise.resolve([])
      ]);
      
      setFeedbacks(userFeedbacks);
      setHiddenSteps(hidden);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  }, [userId, vistoriaTipo]);

  useEffect(() => {
    if (autoLoad && userId) {
      loadFeedbacks();
    }
  }, [autoLoad, userId, loadFeedbacks]);

  const submitFeedback = useCallback(async (input: CreateFeedbackInput) => {
    if (!userId) return;
    
    try {
      await upsertFeedback(userId, input);
      await loadFeedbacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar feedback');
      throw err;
    }
  }, [userId, loadFeedbacks]);

  const createStepFeedback = useCallback(async (
    etapaId: string,
    etapaLabel: string,
    status: FeedbackStatus,
    comentario?: string
  ) => {
    if (!vistoriaTipo) {
      throw new Error('vistoriaTipo é obrigatório para feedback de etapa');
    }
    
    await submitFeedback({
      feature_type: 'vistoria_etapa',
      vistoria_tipo: vistoriaTipo,
      etapa_id: etapaId,
      etapa_label: etapaLabel,
      status,
      comentario
    });
  }, [vistoriaTipo, submitFeedback]);

  const approveStep = useCallback(async (
    etapaId: string,
    etapaLabel: string,
    comentario?: string
  ) => {
    await createStepFeedback(etapaId, etapaLabel, 'approved', comentario);
  }, [createStepFeedback]);

  const rejectStep = useCallback(async (
    etapaId: string,
    etapaLabel: string,
    comentario?: string
  ) => {
    await createStepFeedback(etapaId, etapaLabel, 'rejected', comentario);
  }, [createStepFeedback]);

  const hideStep = useCallback(async (
    etapaId: string,
    etapaLabel: string,
    comentario?: string
  ) => {
    await createStepFeedback(etapaId, etapaLabel, 'hidden', comentario);
  }, [createStepFeedback]);

  const resetStepFeedback = useCallback(async (feedbackId: string) => {
    try {
      await resetFeedback(feedbackId);
      await loadFeedbacks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao resetar feedback');
      throw err;
    }
  }, [loadFeedbacks]);

  const isStepHidden = useCallback((etapaId: string): boolean => {
    return hiddenSteps.includes(etapaId);
  }, [hiddenSteps]);

  const getStepStatus = useCallback((etapaId: string): FeedbackStatus | null => {
    const feedback = feedbacks.find(f => f.etapa_id === etapaId);
    return feedback?.status || null;
  }, [feedbacks]);

  const getStepComment = useCallback((etapaId: string): string | null => {
    const feedback = feedbacks.find(f => f.etapa_id === etapaId);
    return feedback?.comentario || null;
  }, [feedbacks]);

  const refresh = useCallback(async () => {
    clearFeedbackCache();
    await loadFeedbacks();
  }, [loadFeedbacks]);

  return {
    feedbacks,
    hiddenSteps,
    loading,
    error,
    submitFeedback,
    approveStep,
    rejectStep,
    hideStep,
    resetStepFeedback,
    isStepHidden,
    getStepStatus,
    getStepComment,
    refresh
  };
}
