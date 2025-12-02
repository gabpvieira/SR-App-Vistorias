# Photo Service

Service for handling photo upload, compression, validation, and metadata extraction for the Guided Inspection feature.

## Requirements Coverage

- **4.3**: Storage path generation in structured format
- **9.1**: Photo format validation (JPEG, PNG, WebP)
- **9.2**: Rejection of invalid formats
- **9.3**: Compression for files > 10MB
- **9.4**: EXIF metadata preservation

## Usage

### Basic Upload

```typescript
import { photoService } from '@/lib/photo-service';

// Upload a photo
try {
  const photo = await photoService.upload(file, inspectionId, label);
  console.log('Photo uploaded:', photo);
} catch (error) {
  if (error instanceof InvalidFormatError) {
    // Handle invalid format
  } else if (error instanceof NetworkError) {
    // Handle network error (retryable)
  }
}
```

### Validation

```typescript
import { photoService } from '@/lib/photo-service';

const result = photoService.validate(file);
if (!result.valid) {
  console.error(result.error);
}
```

### Compression

```typescript
import { compressPhoto } from '@/lib/photo-service';

// Compress a large file
const compressedFile = await compressPhoto(file);
console.log('Original size:', file.size);
console.log('Compressed size:', compressedFile.size);
```

### Storage Path Generation

```typescript
import { generateStoragePath } from '@/lib/photo-service';

const path = generateStoragePath('insp-123', 'Lateral esquerda completa');
// Returns: "/inspections/insp-123/lateral-esquerda-completa.jpg"
```

### Metadata Extraction

```typescript
import { extractMetadata } from '@/lib/photo-service';

const metadata = await extractMetadata(file);
console.log('Dimensions:', metadata.width, 'x', metadata.height);
console.log('EXIF data:', metadata.exif);
```

## Error Handling

The service provides specific error types for different failure scenarios:

- **InvalidFormatError**: File format is not supported (not retryable)
- **NetworkError**: Network failure during upload (retryable)
- **StorageQuotaError**: Storage quota exceeded (not retryable)
- **PhotoServiceError**: Generic error with retryable flag

## API Reference

### PhotoService Class

#### Methods

- `upload(file: File, inspectionId: string, label: string): Promise<InspectionPhoto>`
- `validate(file: File): ValidationResult`
- `compress(file: File): Promise<File>`
- `generatePath(inspectionId: string, label: string): string`
- `getMetadata(file: File): Promise<{ width: number; height: number; exif?: Record<string, any> }>`

### Standalone Functions

- `uploadPhoto(file: File, inspectionId: string, label: string): Promise<InspectionPhoto>`
- `compressPhoto(file: File, maxSizeMB?: number, quality?: number): Promise<File>`
- `extractMetadata(file: File): Promise<{ width: number; height: number; exif?: Record<string, any> }>`
- `generateStoragePath(inspectionId: string, label: string): string`

## Implementation Notes

### Compression Algorithm

- Files under 10MB are not compressed
- Compression uses HTML5 Canvas API
- Default quality: 0.8 (80%)
- Maximum dimension: 4096px (maintains aspect ratio)
- Output format: JPEG

### Storage Path Format

Pattern: `/inspections/{inspection_id}/{sanitized_label}.jpg`

Label sanitization:
- Converts to lowercase
- Replaces non-alphanumeric characters with hyphens
- Removes leading/trailing hyphens

### Metadata Extraction

Currently extracts:
- Image dimensions (width, height)
- Basic file information (name, size, type, lastModified)

**Note**: For production, consider using a dedicated EXIF library like `exif-js` or `piexifjs` for comprehensive EXIF data extraction.

### Supabase Integration

The current implementation includes a mock upload function. For production:

1. Install Supabase client: `npm install @supabase/supabase-js`
2. Configure Supabase client with your project credentials
3. Replace the mock upload in `uploadPhoto()` with actual Supabase Storage upload
4. Update URL generation to use Supabase public URLs

Example production implementation:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// In uploadPhoto function:
const { data, error } = await supabase.storage
  .from('inspection-photos')
  .upload(storagePath, processedFile, {
    contentType: processedFile.type,
    upsert: false
  });

if (error) throw new NetworkError();

const { data: { publicUrl } } = supabase.storage
  .from('inspection-photos')
  .getPublicUrl(storagePath);
```

## Testing

Run tests with:

```bash
npm test src/lib/photo-service.test.ts
```

Tests cover:
- Storage path generation and sanitization
- Photo format validation
- Service class instantiation and methods
- Error handling scenarios
