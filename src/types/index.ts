/**
 * Central export for all guided inspection types
 */

export {
  VehicleModel,
  VEHICLE_MODEL_LABELS,
  VEHICLE_MODEL_STEPS,
  getStepsForModel,
  validateInspectionComplete,
  getPendingSteps,
  type InspectionStep,
  type InspectionPhoto,
  type CapturedPhoto,
  type UploadResult,
  type CameraAccessResult
} from './guided-inspection';

export {
  SUPPORTED_IMAGE_FORMATS,
  MAX_FILE_SIZE_BYTES,
  validatePhotoFormat,
  needsCompression,
  formatFileSize,
  validatePhoto,
  type ValidationResult
} from '../lib/photo-validation';

export {
  PhotoService,
  photoService,
  generateStoragePath,
  compressPhoto,
  extractMetadata,
  uploadPhoto,
  PhotoServiceError,
  NetworkError,
  StorageQuotaError,
  InvalidFormatError
} from '../lib/photo-service';

// Feedback types
export type {
  FeatureFeedback,
  CreateFeedbackInput,
  UpdateFeedbackInput,
  FeedbackFilters,
  FeedbackStats,
  FeedbackStatus,
  FeatureType,
  FeedbackAmbiente,
  VistoriaTipo
} from './feedback';
