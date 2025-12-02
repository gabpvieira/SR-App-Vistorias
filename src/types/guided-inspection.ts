/**
 * Types and constants for Guided Inspection feature
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

/**
 * Vehicle models available for guided inspection
 */
export enum VehicleModel {
  CAVALO_6X4 = 'cavalo_6x4',
  CAVALO_6X2 = 'cavalo_6x2',
  CARRETA_RODOTREM_9_EIXOS = 'carreta_rodotrem_9_eixos',
  CARRETA_RODOTREM_GRANELEIRO = 'carreta_rodotrem_graneleiro',
  LIVRE = 'livre'
}

/**
 * Display names for vehicle models
 */
export const VEHICLE_MODEL_LABELS: Record<VehicleModel, string> = {
  [VehicleModel.CAVALO_6X4]: 'Cavalo 6x4',
  [VehicleModel.CAVALO_6X2]: 'Cavalo 6x2',
  [VehicleModel.CARRETA_RODOTREM_9_EIXOS]: 'Carreta Rodotrem 9 Eixos',
  [VehicleModel.CARRETA_RODOTREM_GRANELEIRO]: 'Carreta Rodotrem Graneleiro',
  [VehicleModel.LIVRE]: 'Livre'
};

/**
 * Represents a single step in the guided inspection flow
 */
export interface InspectionStep {
  id: string;
  label: string;
  instruction: string;
  illustrationUrl: string;
  order: number;
  isRequired: boolean;
}

/**
 * Represents a photo saved in the inspection
 */
export interface InspectionPhoto {
  id: string;
  inspectionId: string;
  label: string;
  photoUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
  metadata?: {
    width: number;
    height: number;
    exif?: Record<string, any>;
  };
}

/**
 * Represents a photo captured during the inspection flow (before upload)
 */
export interface CapturedPhoto {
  file: File;
  previewUrl: string;
  label: string;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  error?: string;
}

/**
 * Upload status result
 */
export interface UploadResult {
  success: boolean;
  photo?: InspectionPhoto;
  error?: string;
  retryable?: boolean;
}

/**
 * Camera access result
 */
export interface CameraAccessResult {
  granted: boolean;
  message?: string;
}

/**
 * Step sequences for Cavalo 6x4 and 6x2 (identical per Requirements 6.1, 6.2)
 */
const CAVALO_STEPS: InspectionStep[] = [
  {
    id: 'cavalo-1',
    label: 'Foto Frontal (ângulo 45º)',
    instruction: 'Posicione-se a aproximadamente 3 metros do veículo em um ângulo de 45 graus. Capture a frente completa do cavalo mecânico.',
    illustrationUrl: '/illustrations/cavalo-frontal-45.svg',
    order: 1,
    isRequired: true
  },
  {
    id: 'cavalo-2',
    label: 'Lateral esquerda completa',
    instruction: 'Fotografe toda a lateral esquerda do veículo, mantendo distância suficiente para capturar do para-choque dianteiro até a traseira.',
    illustrationUrl: '/illustrations/cavalo-lateral-esquerda.svg',
    order: 2,
    isRequired: true
  },
  {
    id: 'cavalo-3',
    label: 'Lateral direita completa',
    instruction: 'Fotografe toda a lateral direita do veículo, mantendo distância suficiente para capturar do para-choque dianteiro até a traseira.',
    illustrationUrl: '/illustrations/cavalo-lateral-direita.svg',
    order: 3,
    isRequired: true
  },
  {
    id: 'cavalo-4',
    label: 'Traseira (caixa)',
    instruction: 'Capture a parte traseira do cavalo mecânico, incluindo a quinta roda e a caixa traseira.',
    illustrationUrl: '/illustrations/cavalo-traseira.svg',
    order: 4,
    isRequired: true
  },
  {
    id: 'cavalo-5',
    label: 'Painel interno (odômetro)',
    instruction: 'Fotografe o painel de instrumentos com foco no odômetro, garantindo que a quilometragem esteja legível.',
    illustrationUrl: '/illustrations/cavalo-painel.svg',
    order: 5,
    isRequired: true
  },
  {
    id: 'cavalo-6',
    label: 'Chassi lado esquerdo',
    instruction: 'Fotografe o chassi do lado esquerdo, mostrando a estrutura e o número do chassi se visível.',
    illustrationUrl: '/illustrations/cavalo-chassi-esquerdo.svg',
    order: 6,
    isRequired: true
  },
  {
    id: 'cavalo-7',
    label: 'Chassi lado direito',
    instruction: 'Fotografe o chassi do lado direito, mostrando a estrutura e o número do chassi se visível.',
    illustrationUrl: '/illustrations/cavalo-chassi-direito.svg',
    order: 7,
    isRequired: true
  }
];

/**
 * Step sequence for Carreta Rodotrem 9 Eixos (Requirements 6.3)
 */
const RODOTREM_9_EIXOS_STEPS: InspectionStep[] = [
  {
    id: 'rodotrem-1',
    label: 'Vista frontal completa do conjunto',
    instruction: 'Posicione-se de frente para o conjunto completo (cavalo + carretas). Capture todo o veículo em um ângulo que mostre a composição.',
    illustrationUrl: '/illustrations/rodotrem-frontal.svg',
    order: 1,
    isRequired: true
  },
  {
    id: 'rodotrem-2',
    label: 'Lateral esquerda completa',
    instruction: 'Fotografe toda a lateral esquerda do conjunto, incluindo cavalo e ambas as carretas. Pode ser necessário tirar de uma distância maior.',
    illustrationUrl: '/illustrations/rodotrem-lateral-esquerda.svg',
    order: 2,
    isRequired: true
  },
  {
    id: 'rodotrem-3',
    label: 'Lateral direita completa',
    instruction: 'Fotografe toda a lateral direita do conjunto, incluindo cavalo e ambas as carretas. Pode ser necessário tirar de uma distância maior.',
    illustrationUrl: '/illustrations/rodotrem-lateral-direita.svg',
    order: 3,
    isRequired: true
  },
  {
    id: 'rodotrem-4',
    label: 'Traseira completa',
    instruction: 'Capture a traseira da última carreta, mostrando portas, lanternas e placa.',
    illustrationUrl: '/illustrations/rodotrem-traseira.svg',
    order: 4,
    isRequired: true
  },
  {
    id: 'rodotrem-5',
    label: 'Posição dos eixos',
    instruction: 'Fotografe a configuração dos eixos, mostrando a distribuição e o estado geral dos conjuntos de rodas.',
    illustrationUrl: '/illustrations/rodotrem-eixos.svg',
    order: 5,
    isRequired: true
  },
  {
    id: 'rodotrem-6',
    label: 'Pneus detalhe (mínimo 4 fotos)',
    instruction: 'Tire fotos detalhadas de pelo menos 4 pneus diferentes, mostrando a banda de rodagem e condições gerais.',
    illustrationUrl: '/illustrations/rodotrem-pneus.svg',
    order: 6,
    isRequired: true
  }
];

/**
 * Step sequence for Carreta Rodotrem Graneleiro (Requirements 6.4)
 * Includes all Rodotrem 9 Eixos steps plus the tarp/cover detail
 */
const RODOTREM_GRANELEIRO_STEPS: InspectionStep[] = [
  ...RODOTREM_9_EIXOS_STEPS,
  {
    id: 'graneleiro-7',
    label: 'Detalhe da lona ou tampa superior',
    instruction: 'Fotografe a lona ou tampa superior da carreta graneleira, mostrando seu estado de conservação e sistema de fechamento.',
    illustrationUrl: '/illustrations/graneleiro-lona.svg',
    order: 7,
    isRequired: true
  }
];

/**
 * Map of vehicle models to their step sequences
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export const VEHICLE_MODEL_STEPS: Record<VehicleModel, InspectionStep[]> = {
  [VehicleModel.CAVALO_6X4]: CAVALO_STEPS,
  [VehicleModel.CAVALO_6X2]: CAVALO_STEPS, // Same as 6x4 per Requirement 6.2
  [VehicleModel.CARRETA_RODOTREM_9_EIXOS]: RODOTREM_9_EIXOS_STEPS,
  [VehicleModel.CARRETA_RODOTREM_GRANELEIRO]: RODOTREM_GRANELEIRO_STEPS,
  [VehicleModel.LIVRE]: [] // Free mode has no predefined steps
};

/**
 * Get the step sequence for a given vehicle model
 */
export function getStepsForModel(model: VehicleModel): InspectionStep[] {
  return VEHICLE_MODEL_STEPS[model] || [];
}

/**
 * Validate if all required steps have photos
 */
export function validateInspectionComplete(
  steps: InspectionStep[],
  capturedPhotos: Map<string, CapturedPhoto>
): boolean {
  const requiredSteps = steps.filter(step => step.isRequired);
  return requiredSteps.every(step => capturedPhotos.has(step.label));
}

/**
 * Get list of pending required steps
 */
export function getPendingSteps(
  steps: InspectionStep[],
  capturedPhotos: Map<string, CapturedPhoto>
): InspectionStep[] {
  return steps.filter(step => step.isRequired && !capturedPhotos.has(step.label));
}
