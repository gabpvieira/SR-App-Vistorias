/**
 * Photo Service for handling photo upload, compression, and validation
 * Requirements: 4.3, 9.1, 9.2, 9.3, 9.4
 */

import { InspectionPhoto } from '../types/guided-inspection';
import { validatePhoto, needsCompression, ValidationResult } from './photo-validation';

/**
 * Error types for photo operations
 */
export class PhotoServiceError extends Error {
  constructor(message: string, public retryable: boolean = false) {
    super(message);
    this.name = 'PhotoServiceError';
  }
}

export class NetworkError extends PhotoServiceError {
  constructor(message: string = 'Falha na conexão. Verifique sua internet e tente novamente.') {
    super(message, true);
    this.name = 'NetworkError';
  }
}

export class StorageQuotaError extends PhotoServiceError {
  constructor(message: string = 'Espaço de armazenamento insuficiente. Contate o administrador.') {
    super(message, false);
    this.name = 'StorageQuotaError';
  }
}

export class InvalidFormatError extends PhotoServiceError {
  constructor(message: string = 'Formato de arquivo inválido. Use JPEG, PNG ou WebP.') {
    super(message, false);
    this.name = 'InvalidFormatError';
  }
}

/**
 * Generate structured storage path for Supabase Storage
 * Requirements: 4.3
 * 
 * @param inspectionId - The inspection ID
 * @param label - The photo label (step name)
 * @returns Structured path in format "/inspections/{inspection_id}/{label}.jpg"
 */
export function generateStoragePath(inspectionId: string, label: string): string {
  // Sanitize label to create a valid filename
  const sanitizedLabel = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `/inspections/${inspectionId}/${sanitizedLabel}.jpg`;
}

/**
 * Compress photo if it exceeds the size limit
 * Requirements: 9.3
 * 
 * @param file - The file to compress
 * @param maxSizeMB - Maximum size in MB (default 10MB)
 * @param quality - Compression quality 0-1 (default 0.8)
 * @returns Compressed file or original if under limit
 */
export async function compressPhoto(
  file: File,
  maxSizeMB: number = 10,
  quality: number = 0.8
): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // If file is already under the limit, return as-is
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo para compressão'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão'));
      
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Erro ao criar contexto de canvas'));
          return;
        }

        // Maintain aspect ratio
        let width = img.width;
        let height = img.height;
        
        // If image is very large, scale it down
        const maxDimension = 4096;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }
            
            // Create new file from blob
            const compressedFile = new File(
              [blob],
              file.name,
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Extract EXIF metadata from image file
 * Requirements: 9.4
 * 
 * Note: This is a simplified implementation. For production, consider using
 * a library like 'exif-js' or 'piexifjs' for comprehensive EXIF extraction.
 * 
 * @param file - The image file
 * @param timeoutMs - Timeout in milliseconds (default 5000ms)
 * @returns Promise with basic metadata
 */
export async function extractMetadata(
  file: File,
  timeoutMs: number = 5000
): Promise<{
  width: number;
  height: number;
  exif?: Record<string, any>;
}> {
  return new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging in test environments
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout ao extrair metadados da imagem'));
    }, timeoutMs);

    const reader = new FileReader();
    
    reader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Erro ao ler arquivo para extração de metadados'));
    };
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Erro ao carregar imagem para extração de metadados'));
      };
      
      img.onload = () => {
        clearTimeout(timeoutId);
        // Basic metadata - width and height
        const metadata = {
          width: img.width,
          height: img.height,
          exif: {
            // In a real implementation, we would extract EXIF data here
            // For now, we preserve basic file information
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            lastModified: new Date(file.lastModified).toISOString()
          }
        };
        
        resolve(metadata);
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload photo to storage
 * Requirements: 4.3, 4.4, 4.5, 9.1, 9.2, 9.3, 9.4
 * 
 * @param file - The photo file to upload
 * @param inspectionId - The inspection ID
 * @param label - The photo label
 * @returns Promise with InspectionPhoto or error
 */
export async function uploadPhoto(
  file: File,
  inspectionId: string,
  label: string
): Promise<InspectionPhoto> {
  // Validate photo format
  const validation = validatePhoto(file);
  if (!validation.valid) {
    throw new InvalidFormatError(validation.error);
  }

  // Compress if needed
  let processedFile = file;
  if (needsCompression(file)) {
    try {
      processedFile = await compressPhoto(file);
    } catch (error) {
      throw new PhotoServiceError(
        'Erro ao comprimir imagem. Tente novamente.',
        true
      );
    }
  }

  // Extract metadata
  let metadata;
  try {
    metadata = await extractMetadata(processedFile);
  } catch (error) {
    // Non-critical error, continue without metadata
    metadata = { width: 0, height: 0 };
  }

  // Generate storage path
  const storagePath = generateStoragePath(inspectionId, label);

  // TODO: In production, this would upload to Supabase Storage
  // For now, we'll create a mock implementation
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock: Create object URL for preview (in production, this would be the Supabase URL)
    const photoUrl = URL.createObjectURL(processedFile);

    // Create InspectionPhoto object
    const inspectionPhoto: InspectionPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      inspectionId,
      label,
      photoUrl,
      fileSize: processedFile.size,
      mimeType: processedFile.type,
      createdAt: new Date(),
      metadata
    };

    return inspectionPhoto;
  } catch (error) {
    // Simulate network errors
    if (error instanceof TypeError) {
      throw new NetworkError();
    }
    
    throw new PhotoServiceError(
      'Erro ao enviar foto. Tente novamente.',
      true
    );
  }
}

/**
 * PhotoService class for managing photo operations
 */
export class PhotoService {
  /**
   * Upload a photo with validation and compression
   */
  async upload(
    file: File,
    inspectionId: string,
    label: string
  ): Promise<InspectionPhoto> {
    return uploadPhoto(file, inspectionId, label);
  }

  /**
   * Validate photo format
   */
  validate(file: File): ValidationResult {
    return validatePhoto(file);
  }

  /**
   * Compress photo if needed
   */
  async compress(file: File): Promise<File> {
    return compressPhoto(file);
  }

  /**
   * Generate storage path
   */
  generatePath(inspectionId: string, label: string): string {
    return generateStoragePath(inspectionId, label);
  }

  /**
   * Extract metadata from photo
   */
  async getMetadata(file: File): Promise<{
    width: number;
    height: number;
    exif?: Record<string, any>;
  }> {
    return extractMetadata(file);
  }
}

// Export singleton instance
export const photoService = new PhotoService();
