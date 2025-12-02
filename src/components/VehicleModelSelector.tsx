import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VehicleModel, VEHICLE_MODEL_LABELS } from '@/types';

interface VehicleModelSelectorProps {
  value: VehicleModel | null;
  onChange: (model: VehicleModel) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * VehicleModelSelector Component
 * 
 * Allows selection of vehicle model for guided inspection.
 * Requirements: 1.1, 1.2, 1.3, 1.4
 * 
 * - Displays 5 vehicle model options (Requirement 1.2)
 * - Required field validation (Requirement 1.3)
 * - Only shown for "Troca" inspection type (Requirement 1.1, 1.4)
 * - Follows design system: Poppins font, flat design, white background (Requirement 7.1, 7.2)
 */
export function VehicleModelSelector({
  value,
  onChange,
  disabled = false,
  error
}: VehicleModelSelectorProps) {
  const models = [
    VehicleModel.CAVALO_6X4,
    VehicleModel.CAVALO_6X2,
    VehicleModel.CARRETA_RODOTREM_9_EIXOS,
    VehicleModel.CARRETA_RODOTREM_GRANELEIRO,
    VehicleModel.LIVRE
  ];

  return (
    <div className="space-y-3">
      <Label className={error ? 'text-destructive' : ''}>
        Modelo de Vistoria Guiada *
      </Label>
      <RadioGroup
        value={value || ''}
        onValueChange={(v) => onChange(v as VehicleModel)}
        disabled={disabled}
        className="flex flex-col gap-3"
      >
        {models.map((model) => (
          <div
            key={model}
            className="flex items-center space-x-3 bg-white border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <RadioGroupItem value={model} id={model} />
            <Label
              htmlFor={model}
              className="cursor-pointer font-normal flex-1"
            >
              {VEHICLE_MODEL_LABELS[model]}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
