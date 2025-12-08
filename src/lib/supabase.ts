import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export type UserRole = 'vendedor' | 'gerente';
export type InspectionType = 'troca' | 'manutencao';
export type VehicleModel = 'cavalo' | 'rodotrem_basculante' | 'rodotrem_graneleiro' | 'livre';
export type InspectionStatus = 'rascunho' | 'concluida' | 'aprovada' | 'rejeitada';
export type VehicleStatus = 'novo' | 'seminovo';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  user_id: string;
  type: InspectionType;
  vehicle_model?: VehicleModel;
  is_guided_inspection: boolean;
  guided_photos_complete: boolean;
  vehicle_plate: string;
  vehicle_brand?: string;
  vehicle_model_name: string;
  vehicle_year: number; // Ano de fabricação
  vehicle_model_year?: number; // Ano do modelo
  vehicle_status: VehicleStatus;
  odometer?: number;
  notes?: string;
  status: InspectionStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_id: string;
  label: string;
  step_order?: number;
  photo_url: string;
  thumbnail_url?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  exif_data?: Record<string, any>;
  created_at: string;
}

export interface InspectionStepTemplate {
  id: string;
  vehicle_model: Exclude<VehicleModel, 'livre'>;
  label: string;
  instruction: string;
  illustration_url?: string;
  step_order: number;
  is_required: boolean;
  created_at: string;
}
