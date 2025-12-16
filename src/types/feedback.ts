/**
 * Types for Feature Feedback System
 * Allows clients to evaluate, approve, reject or hide inspection steps
 */

export type FeedbackStatus = 'approved' | 'rejected' | 'hidden' | 'pending';
export type FeatureType = 'vistoria_etapa' | 'funcionalidade_geral' | 'interface' | 'fluxo';
export type FeedbackAmbiente = 'production' | 'development';
export type VistoriaTipo = 'cavalo' | 'rodotrem_basculante' | 'rodotrem_graneleiro' | 'livre' | 'troca' | 'manutencao';

export interface FeatureFeedback {
  id: string;
  user_id: string;
  feature_type: FeatureType;
  vistoria_tipo?: VistoriaTipo;
  etapa_id?: string;
  etapa_label?: string;
  status: FeedbackStatus;
  comentario?: string;
  ambiente: FeedbackAmbiente;
  created_at: string;
  updated_at: string;
}

export interface CreateFeedbackInput {
  feature_type: FeatureType;
  vistoria_tipo?: VistoriaTipo;
  etapa_id?: string;
  etapa_label?: string;
  status: FeedbackStatus;
  comentario?: string;
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  comentario?: string;
}

export interface FeedbackFilters {
  vistoria_tipo?: VistoriaTipo;
  status?: FeedbackStatus;
  feature_type?: FeatureType;
  ambiente?: FeedbackAmbiente;
}

export interface FeedbackStats {
  total: number;
  approved: number;
  rejected: number;
  hidden: number;
  pending: number;
  byVistoriaTipo: Record<VistoriaTipo, number>;
}
