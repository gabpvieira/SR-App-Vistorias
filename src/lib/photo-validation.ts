/**
 * Photo validation utilities for guided inspection
 * Requirements: 9.1, 9.2, 9.3
 */

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;

/**
 * Maximum file size before compression (10MB)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validate if a file has a supported image format
 * Requirements: 9.1, 9.2
 */
export function validatePhotoFormat(file: File): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(file.type as any);
}

/**
 * Check if a file needs compression
 * Requirements: 9.3
 */
export function needsCompression(file: File): boolean {
  return file.size > MAX_FILE_SIZE_BYTES;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Comprehensive photo validation
 */
export function validatePhoto(file: File): ValidationResult {
  // Check format
  if (!validatePhotoFormat(file)) {
    return {
      valid: false,
      error: 'Formato de arquivo inválido. Use JPEG, PNG ou WebP.'
    };
  }

  // Check if file is too large (we'll compress, but warn if extremely large)
  const maxAllowedSize = 50 * 1024 * 1024; // 50MB absolute max
  if (file.size > maxAllowedSize) {
    return {
      valid: false,
      error: `Arquivo muito grande (${formatFileSize(file.size)}). O tamanho máximo é ${formatFileSize(maxAllowedSize)}.`
    };
  }

  return { valid: true };
}
