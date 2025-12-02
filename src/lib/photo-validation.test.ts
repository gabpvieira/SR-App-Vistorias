/**
 * Property-based tests for Photo Validation
 * Feature: vistoria-guiada
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validatePhotoFormat, SUPPORTED_IMAGE_FORMATS } from './photo-validation';

describe('Photo Validation - Property Tests', () => {
  /**
   * Feature: vistoria-guiada, Property 23: Validação aceita formatos suportados
   * Validates: Requirements 9.1
   * 
   * This property verifies that the validation function accepts all supported
   * image formats (JPEG, PNG, WebP).
   */
  it('Property 23: Validation should accept all supported formats', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SUPPORTED_IMAGE_FORMATS),
        (mimeType) => {
          // Create a file with the supported MIME type
          const file = new File(['test content'], 'test-image.jpg', { type: mimeType });
          
          // Property: validatePhotoFormat must return true for all supported formats
          const result = validatePhotoFormat(file);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: vistoria-guiada, Property 24: Validação rejeita formatos não suportados
   * Validates: Requirements 9.2
   * 
   * This property verifies that the validation function rejects all unsupported
   * image formats (anything other than JPEG, PNG, WebP).
   */
  it('Property 24: Validation should reject all unsupported formats', () => {
    // Define a set of unsupported MIME types
    const unsupportedFormats = [
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/svg+xml',
      'image/x-icon',
      'image/heic',
      'image/heif',
      'application/pdf',
      'video/mp4',
      'text/plain',
      'application/octet-stream'
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...unsupportedFormats),
        (mimeType) => {
          // Create a file with an unsupported MIME type
          const file = new File(['test content'], 'test-file', { type: mimeType });
          
          // Property: validatePhotoFormat must return false for all unsupported formats
          const result = validatePhotoFormat(file);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional verification: Supported formats constant has exactly 3 formats
   */
  it('Property 23 (supplementary): SUPPORTED_IMAGE_FORMATS should contain exactly 3 formats', () => {
    fc.assert(
      fc.property(
        fc.constant(SUPPORTED_IMAGE_FORMATS),
        (formats) => {
          // Property: There must be exactly 3 supported formats
          expect(formats).toHaveLength(3);
          
          // Property: The formats must be JPEG, PNG, and WebP
          expect(formats).toContain('image/jpeg');
          expect(formats).toContain('image/png');
          expect(formats).toContain('image/webp');
        }
      ),
      { numRuns: 100 }
    );
  });



  /**
   * Additional verification: Empty or null MIME types are rejected
   */
  it('Property 24 (supplementary): Validation should reject empty MIME types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', null, undefined),
        (invalidMimeType) => {
          // Create a file with empty/invalid MIME type
          const file = new File(['test content'], 'test.jpg', { type: invalidMimeType as any });
          
          // Property: Validation should reject empty or invalid MIME types
          const result = validatePhotoFormat(file);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
