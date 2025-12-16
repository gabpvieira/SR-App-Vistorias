/**
 * Feedback Service - Manages feature feedback in production
 * Allows clients to evaluate inspection steps without affecting real data
 */

import { supabase } from './supabase';
import type {
  FeatureFeedback,
  CreateFeedbackInput,
  UpdateFeedbackInput,
  FeedbackFilters,
  FeedbackStats,
  FeedbackStatus,
  VistoriaTipo
} from '../types/feedback';

const CACHE_KEY = 'feature_feedback_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CacheData {
  feedbacks: FeatureFeedback[];
  timestamp: number;
}

// Detecta ambiente
const isProduction = import.meta.env.PROD;
const ambiente = isProduction ? 'production' : 'development';

/**
 * Get cached feedbacks from localStorage
 */
function getCachedFeedbacks(): FeatureFeedback[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CacheData = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data.feedbacks;
  } catch {
    return null;
  }
}

/**
 * Set feedbacks in localStorage cache
 */
function setCachedFeedbacks(feedbacks: FeatureFeedback[]): void {
  try {
    const data: CacheData = { feedbacks, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear feedback cache
 */
export function clearFeedbackCache(): void {
  localStorage.removeItem(CACHE_KEY);
}


/**
 * Get all feedbacks for current user
 */
export async function getUserFeedbacks(
  userId: string,
  filters?: FeedbackFilters
): Promise<FeatureFeedback[]> {
  // Try cache first
  const cached = getCachedFeedbacks();
  if (cached && !filters) {
    return cached.filter(f => f.user_id === userId);
  }

  let query = supabase
    .from('feature_feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.vistoria_tipo) {
    query = query.eq('vistoria_tipo', filters.vistoria_tipo);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.feature_type) {
    query = query.eq('feature_type', filters.feature_type);
  }
  if (filters?.ambiente) {
    query = query.eq('ambiente', filters.ambiente);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }

  if (!filters) {
    setCachedFeedbacks(data || []);
  }

  return data || [];
}

/**
 * Get all feedbacks (for managers/development panel)
 */
export async function getAllFeedbacks(
  filters?: FeedbackFilters
): Promise<FeatureFeedback[]> {
  let query = supabase
    .from('feature_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.vistoria_tipo) {
    query = query.eq('vistoria_tipo', filters.vistoria_tipo);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.feature_type) {
    query = query.eq('feature_type', filters.feature_type);
  }
  if (filters?.ambiente) {
    query = query.eq('ambiente', filters.ambiente);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all feedbacks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get feedback for a specific step
 */
export async function getStepFeedback(
  userId: string,
  vistoriaTipo: VistoriaTipo,
  etapaId: string
): Promise<FeatureFeedback | null> {
  const { data, error } = await supabase
    .from('feature_feedback')
    .select('*')
    .eq('user_id', userId)
    .eq('vistoria_tipo', vistoriaTipo)
    .eq('etapa_id', etapaId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching step feedback:', error);
    throw error;
  }

  return data;
}

/**
 * Create or update feedback for a step
 */
export async function upsertFeedback(
  userId: string,
  input: CreateFeedbackInput
): Promise<FeatureFeedback> {
  const feedbackData = {
    user_id: userId,
    feature_type: input.feature_type,
    vistoria_tipo: input.vistoria_tipo,
    etapa_id: input.etapa_id,
    etapa_label: input.etapa_label,
    status: input.status,
    comentario: input.comentario,
    ambiente,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('feature_feedback')
    .upsert(feedbackData, {
      onConflict: 'user_id,feature_type,vistoria_tipo,etapa_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting feedback:', error);
    throw error;
  }

  clearFeedbackCache();
  return data;
}

/**
 * Update existing feedback
 */
export async function updateFeedback(
  feedbackId: string,
  input: UpdateFeedbackInput
): Promise<FeatureFeedback> {
  const { data, error } = await supabase
    .from('feature_feedback')
    .update({
      ...input,
      updated_at: new Date().toISOString()
    })
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }

  clearFeedbackCache();
  return data;
}

/**
 * Delete feedback (soft delete by setting status to pending)
 */
export async function resetFeedback(feedbackId: string): Promise<void> {
  const { error } = await supabase
    .from('feature_feedback')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', feedbackId);

  if (error) {
    console.error('Error resetting feedback:', error);
    throw error;
  }

  clearFeedbackCache();
}

/**
 * Get hidden steps for a vistoria type
 */
export async function getHiddenSteps(
  userId: string,
  vistoriaTipo: VistoriaTipo
): Promise<string[]> {
  const { data, error } = await supabase
    .from('feature_feedback')
    .select('etapa_id')
    .eq('user_id', userId)
    .eq('vistoria_tipo', vistoriaTipo)
    .eq('status', 'hidden');

  if (error) {
    console.error('Error fetching hidden steps:', error);
    return [];
  }

  return data?.map(f => f.etapa_id).filter(Boolean) as string[] || [];
}

/**
 * Get feedback statistics
 */
export async function getFeedbackStats(
  filters?: FeedbackFilters
): Promise<FeedbackStats> {
  const feedbacks = await getAllFeedbacks(filters);

  const stats: FeedbackStats = {
    total: feedbacks.length,
    approved: feedbacks.filter(f => f.status === 'approved').length,
    rejected: feedbacks.filter(f => f.status === 'rejected').length,
    hidden: feedbacks.filter(f => f.status === 'hidden').length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    byVistoriaTipo: {} as Record<VistoriaTipo, number>
  };

  // Count by vistoria tipo
  feedbacks.forEach(f => {
    if (f.vistoria_tipo) {
      stats.byVistoriaTipo[f.vistoria_tipo] = 
        (stats.byVistoriaTipo[f.vistoria_tipo] || 0) + 1;
    }
  });

  return stats;
}

/**
 * Check if a step should be visible (not hidden)
 */
export function isStepVisible(
  hiddenSteps: string[],
  etapaId: string
): boolean {
  return !hiddenSteps.includes(etapaId);
}
