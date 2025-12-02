# Guided Inspection Types

This directory contains TypeScript types, enums, and constants for the Guided Inspection feature.

## Files

### `guided-inspection.ts`
Core types and constants for the guided inspection feature.

**Enums:**
- `VehicleModel`: Five vehicle model options (Cavalo 6x4, Cavalo 6x2, Carreta Rodotrem 9 Eixos, Carreta Rodotrem Graneleiro, Livre)

**Interfaces:**
- `InspectionStep`: Represents a single step in the guided flow
- `InspectionPhoto`: Represents a saved photo with metadata
- `CapturedPhoto`: Represents a photo during capture (before upload)
- `UploadResult`: Result of photo upload operation
- `CameraAccessResult`: Result of camera permission request

**Constants:**
- `VEHICLE_MODEL_LABELS`: Display names for each vehicle model
- `VEHICLE_MODEL_STEPS`: Step sequences for each vehicle model
  - Cavalo 6x4: 7 steps (Requirement 6.1)
  - Cavalo 6x2: 7 steps, identical to 6x4 (Requirement 6.2)
  - Carreta Rodotrem 9 Eixos: 6 steps (Requirement 6.3)
  - Carreta Rodotrem Graneleiro: 7 steps (6 from Rodotrem + 1 tarp detail) (Requirement 6.4)
  - Livre: 0 steps (free mode)

**Functions:**
- `getStepsForModel(model)`: Returns step sequence for a vehicle model
- `validateInspectionComplete(steps, photos)`: Checks if all required steps have photos
- `getPendingSteps(steps, photos)`: Returns list of incomplete required steps

### `index.ts`
Central export file for all guided inspection types and utilities.

## Related Files

### `src/lib/photo-validation.ts`
Photo validation utilities:
- `validatePhotoFormat(file)`: Validates file format (JPEG, PNG, WebP)
- `needsCompression(file)`: Checks if file exceeds 10MB
- `validatePhoto(file)`: Comprehensive photo validation
- `formatFileSize(bytes)`: Human-readable file size

### `src/lib/guided-inspection-verification.ts`
Verification utilities to ensure implementation matches requirements:
- `verifyVehicleModelCount()`: Confirms 5 vehicle models
- `verifyCavalo6x4Steps()`: Confirms 7 steps with correct labels
- `verifyCavalo6x2EqualsTo6x4()`: Confirms 6x2 equals 6x4
- `verifyRodotrem9EixosSteps()`: Confirms 6 steps with correct labels
- `verifyRodotremGraneleiroSteps()`: Confirms 7 steps (6 + tarp)
- `verifyLivreModeHasNoSteps()`: Confirms Livre has no steps
- `runAllVerifications()`: Runs all verification tests

### `src/pages/VerifyTypes.tsx`
Development page to visually verify types and constants in the browser.

## Extended Types

### `src/lib/mock-data.ts`
The `Inspection` interface has been extended with:
- `vehicleModel?: string`: Selected vehicle model
- `isGuidedInspection?: boolean`: Whether inspection uses guided flow
- `guidedPhotosComplete?: boolean`: Whether all guided photos are captured

## Usage Example

```typescript
import { 
  VehicleModel, 
  getStepsForModel, 
  validateInspectionComplete 
} from '@/types/guided-inspection';

// Get steps for a vehicle model
const steps = getStepsForModel(VehicleModel.CAVALO_6X4);
console.log(`Cavalo 6x4 has ${steps.length} steps`); // 7 steps

// Validate completion
const capturedPhotos = new Map();
const isComplete = validateInspectionComplete(steps, capturedPhotos);
console.log(`Inspection complete: ${isComplete}`); // false
```

## Requirements Coverage

This implementation satisfies the following requirements:
- **Requirement 1.2**: Five vehicle model options
- **Requirement 6.1**: Cavalo 6x4 has 7 specific steps
- **Requirement 6.2**: Cavalo 6x2 equals Cavalo 6x4
- **Requirement 6.3**: Rodotrem 9 Eixos has 6 specific steps
- **Requirement 6.4**: Rodotrem Graneleiro has 7 steps (6 + tarp detail)
- **Requirement 9.1, 9.2**: Photo format validation
- **Requirement 9.3**: File size checking for compression
