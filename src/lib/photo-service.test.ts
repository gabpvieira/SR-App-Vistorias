/**
 * Tests for PhotoService
 * Requirements: 4.3, 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateStoragePath,
  compressPhoto,
  extractMetadata,
  PhotoService,
  InvalidFormatError
} from './photo-service';
import { validatePhoto, needsCompression } from './photo-validation';

describe('PhotoService', () => {
  describe('generateStoragePath', () => {
    it('should generate path in correct format', () => {
      const path = generateStoragePath('insp-123', 'Lateral esquerda completa');
      expect(path).toBe('/inspections/insp-123/lateral-esquerda-completa.jpg');
    });

    it('should sanitize special characters in label', () => {
      const path = generateStoragePath('insp-456', 'Foto Frontal (ângulo 45º)');
      expect(path).toBe('/inspections/insp-456/foto-frontal-ngulo-45.jpg');
    });

    it('should handle labels with multiple spaces', () => {
      const path = generateStoragePath('insp-789', 'Vista   frontal   completa');
      expect(path).toBe('/inspections/insp-789/vista-frontal-completa.jpg');
    });
  });

  describe('validatePhoto', () => {
    it('should accept JPEG format', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = validatePhoto(file);
      expect(result.valid).toBe(true);
    });

    it('should accept PNG format', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const result = validatePhoto(file);
      expect(result.valid).toBe(true);
    });

    it('should accept WebP format', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      const result = validatePhoto(file);
      expect(result.valid).toBe(true);
    });

    it('should reject unsupported formats', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      const result = validatePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Formato de arquivo inválido');
    });

    it('should reject extremely large files', () => {
      const largeSize = 51 * 1024 * 1024; // 51MB
      const file = new File([new ArrayBuffer(largeSize)], 'large.jpg', { type: 'image/jpeg' });
      const result = validatePhoto(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('muito grande');
    });
  });

  describe('PhotoService class', () => {
    it('should create instance', () => {
      const service = new PhotoService();
      expect(service).toBeDefined();
      expect(service.upload).toBeDefined();
      expect(service.validate).toBeDefined();
      expect(service.compress).toBeDefined();
      expect(service.generatePath).toBeDefined();
      expect(service.getMetadata).toBeDefined();
    });

    it('should validate photo through service', () => {
      const service = new PhotoService();
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = service.validate(file);
      expect(result.valid).toBe(true);
    });

    it('should generate path through service', () => {
      const service = new PhotoService();
      const path = service.generatePath('insp-123', 'Test Label');
      expect(path).toBe('/inspections/insp-123/test-label.jpg');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: vistoria-guiada, Property 11: Path de storage segue padrão estruturado
     * Validates: Requirements 4.3
     * 
     * This property test verifies that storage paths follow the structured format:
     * "/inspections/{inspection_id}/{label}.jpg"
     * 
     * For any valid inspection_id and label, the generated path must:
     * - Start with "/inspections/"
     * - Contain the inspection_id
     * - End with ".jpg"
     * - Have exactly 3 path segments (/, inspections/, id/, filename.jpg)
     * - The sanitized label should be a valid filename
     */
    it('should generate storage paths following structured pattern', () => {
      fc.assert(
        fc.property(
          // Generate valid inspection IDs (alphanumeric with hyphens/underscores)
          fc.stringMatching(/^[a-zA-Z0-9_-]+$/),
          // Generate labels with at least some alphanumeric content
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => /[a-zA-Z0-9]/.test(s)),
          (inspectionId, label) => {
            const path = generateStoragePath(inspectionId, label);
            
            // Path must start with "/inspections/"
            expect(path).toMatch(/^\/inspections\//);
            
            // Path must end with ".jpg"
            expect(path).toMatch(/\.jpg$/);
            
            // Path must contain the inspection_id
            expect(path).toContain(inspectionId);
            
            // Path should have exactly 3 segments: /, inspections/, {id}/, {filename}.jpg
            const segments = path.split('/').filter(s => s.length > 0);
            expect(segments.length).toBe(3); // ['inspections', '{id}', '{filename}.jpg']
            expect(segments[0]).toBe('inspections');
            expect(segments[1]).toBe(inspectionId);
            expect(segments[2]).toMatch(/\.jpg$/);
            
            // The filename should not be empty (excluding the .jpg extension)
            const filename = segments[2].replace('.jpg', '');
            expect(filename.length).toBeGreaterThan(0);
            
            // The filename should only contain valid characters (lowercase alphanumeric and hyphens)
            expect(filename).toMatch(/^[a-z0-9-]+$/);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: vistoria-guiada, Property 25: Imagens grandes são comprimidas
     * Validates: Requirements 9.3
     * 
     * This property test verifies the compression decision logic:
     * - Files > 10MB should be identified as needing compression
     * - Files <= 10MB should not need compression
     * - The compressPhoto function respects this threshold
     */
    it('should identify files larger than 10MB as needing compression', async () => {
      const tenMB = 10 * 1024 * 1024; // 10,485,760 bytes
      
      await fc.assert(
        fc.property(
          fc.integer({ min: tenMB + 1, max: 50_000_000 }), // size in bytes > 10MB
          (fileSize) => {
            // Create a file with the specified size
            const buffer = new ArrayBuffer(fileSize);
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            const largeFile = new File([blob], 'test-large.jpg', { type: 'image/jpeg' });
            
            // Verify the file is larger than 10MB
            expect(largeFile.size).toBeGreaterThan(tenMB);
            
            // The needsCompression function should return true
            const needsComp = needsCompression(largeFile);
            expect(needsComp).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional test: Files under 10MB should not need compression
     * This verifies the threshold logic works correctly
     */
    it('should not compress images smaller than or equal to 10MB', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 10_485_760 }), // size in bytes <= 10MB
          async (fileSize) => {
            // Create a simple file
            const buffer = new ArrayBuffer(fileSize);
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            const smallFile = new File([blob], 'test-small.jpg', { type: 'image/jpeg' });
            
            // Verify needsCompression returns false
            const needsComp = needsCompression(smallFile);
            expect(needsComp).toBe(false);
            
            // Call compressPhoto - it should return the original file unchanged
            const result = await compressPhoto(smallFile);
            
            // File should be returned unchanged (same reference)
            expect(result).toBe(smallFile);
            expect(result.size).toBe(fileSize);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: vistoria-guiada, Property 10: Foto salva tem metadados completos
     * Validates: Requirements 4.1, 4.2, 4.4, 4.5
     * 
     * This property test verifies that saved photos have complete metadata:
     * - inspectionId must be non-null and non-empty
     * - label must be non-null and non-empty
     * - photoUrl must be non-null and non-empty
     * - createdAt must be non-null and a valid Date
     * 
     * For any valid file, inspectionId, and label, the uploadPhoto function
     * must return an InspectionPhoto with all required metadata fields populated.
     * 
     * Note: This test uses a reduced number of runs (20 instead of 100) because
     * image processing with FileReader and Image loading in jsdom is slow.
     * Each run involves a 5-second timeout for metadata extraction.
     */
    it('should save photos with complete metadata', async () => {
      // Create a minimal 1x1 pixel JPEG image as base64
      // This is a valid JPEG that can be loaded quickly in tests
      const base64Image = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
      
      // Helper function to create a valid image file from base64
      const createImageFile = (mimeType: string): File => {
        const binaryString = atob(base64Image);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        return new File([blob], 'test-photo.jpg', { type: mimeType });
      };

      await fc.assert(
        fc.asyncProperty(
          // Generate valid inspection IDs
          fc.stringMatching(/^[a-zA-Z0-9_-]+$/).filter(s => s.length > 0),
          // Generate valid labels
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /[a-zA-Z0-9]/.test(s)),
          // Generate valid MIME types
          fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
          async (inspectionId, label, mimeType) => {
            // Create a valid image file
            const file = createImageFile(mimeType);
            
            // Create PhotoService instance
            const service = new PhotoService();
            
            // Upload the photo
            const savedPhoto = await service.upload(file, inspectionId, label);
            
            // Verify all required metadata fields are non-null and valid
            
            // Requirement 4.1: inspectionId must be present
            expect(savedPhoto.inspectionId).toBeTruthy();
            expect(savedPhoto.inspectionId).toBe(inspectionId);
            expect(typeof savedPhoto.inspectionId).toBe('string');
            expect(savedPhoto.inspectionId.length).toBeGreaterThan(0);
            
            // Requirement 4.2: label must be present
            expect(savedPhoto.label).toBeTruthy();
            expect(savedPhoto.label).toBe(label);
            expect(typeof savedPhoto.label).toBe('string');
            expect(savedPhoto.label.length).toBeGreaterThan(0);
            
            // Requirement 4.5: photoUrl must be present
            expect(savedPhoto.photoUrl).toBeTruthy();
            expect(typeof savedPhoto.photoUrl).toBe('string');
            expect(savedPhoto.photoUrl.length).toBeGreaterThan(0);
            
            // Requirement 4.4: createdAt must be present and valid
            expect(savedPhoto.createdAt).toBeTruthy();
            expect(savedPhoto.createdAt).toBeInstanceOf(Date);
            expect(savedPhoto.createdAt.getTime()).not.toBeNaN();
            
            // Additional metadata checks (id, fileSize, mimeType should also be present)
            expect(savedPhoto.id).toBeTruthy();
            expect(typeof savedPhoto.id).toBe('string');
            expect(savedPhoto.id.length).toBeGreaterThan(0);
            
            expect(savedPhoto.fileSize).toBeGreaterThan(0);
            expect(typeof savedPhoto.fileSize).toBe('number');
            
            expect(savedPhoto.mimeType).toBeTruthy();
            expect(typeof savedPhoto.mimeType).toBe('string');
            expect(['image/jpeg', 'image/png', 'image/webp']).toContain(savedPhoto.mimeType);
            
            return true;
          }
        ),
        { numRuns: 20 } // Reduced from 100 due to slow image processing in jsdom test environment
      );
    }, 150000); // Timeout for 20 runs with image processing (each can take up to 5s)
  });
});
