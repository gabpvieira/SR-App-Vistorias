/**
 * Property-based tests for Guided Inspection
 * Feature: vistoria-guiada
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  VehicleModel, 
  VEHICLE_MODEL_LABELS,
  getStepsForModel,
  VEHICLE_MODEL_STEPS
} from './guided-inspection';

describe('Guided Inspection - Property Tests', () => {
  /**
   * Feature: vistoria-guiada, Property 2: Modelo de vistoria tem exatamente 5 opções
   * Validates: Requirements 1.2
   * 
   * This property verifies that the vehicle model selection always provides
   * exactly 5 options: Cavalo 6x4, Cavalo 6x2, Carreta Rodotrem 9 Eixos,
   * Carreta Rodotrem Graneleiro, and Livre.
   */
  it('Property 2: Vehicle model field should have exactly 5 options', () => {
    fc.assert(
      fc.property(
        fc.constant(VehicleModel),
        (vehicleModelEnum) => {
          // Get all enum values
          const modelValues = Object.values(vehicleModelEnum);
          
          // Property: There must be exactly 5 vehicle model options
          expect(modelValues).toHaveLength(5);
          
          // Verify the specific expected models are present
          const expectedModels = [
            'cavalo_6x4',
            'cavalo_6x2',
            'carreta_rodotrem_9_eixos',
            'carreta_rodotrem_graneleiro',
            'livre'
          ];
          
          expect(modelValues.sort()).toEqual(expectedModels.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional verification: Each model has a corresponding label
   */
  it('Property 2 (supplementary): Each vehicle model has a display label', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(VehicleModel)),
        (model) => {
          // Every model should have a label
          expect(VEHICLE_MODEL_LABELS[model]).toBeDefined();
          expect(VEHICLE_MODEL_LABELS[model]).toBeTruthy();
          expect(typeof VEHICLE_MODEL_LABELS[model]).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional verification: Labels object has exactly 5 entries
   */
  it('Property 2 (supplementary): Vehicle model labels has exactly 5 entries', () => {
    fc.assert(
      fc.property(
        fc.constant(VEHICLE_MODEL_LABELS),
        (labels) => {
          const labelKeys = Object.keys(labels);
          expect(labelKeys).toHaveLength(5);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: vistoria-guiada, Property 14: Cavalo 6x4 tem 7 etapas específicas
   * Validates: Requirements 6.1
   * 
   * This property verifies that the Cavalo 6x4 model always returns exactly 7 steps
   * with the specific labels in the correct order.
   */
  it('Property 14: Cavalo 6x4 should have exactly 7 specific steps in order', () => {
    const expectedLabels = [
      'Foto Frontal (ângulo 45º)',
      'Lateral esquerda completa',
      'Lateral direita completa',
      'Traseira (caixa)',
      'Painel interno (odômetro)',
      'Chassi lado esquerdo',
      'Chassi lado direito'
    ];

    fc.assert(
      fc.property(
        fc.constant(VehicleModel.CAVALO_6X4),
        (model) => {
          const steps = getStepsForModel(model);
          
          // Property: Must have exactly 7 steps
          expect(steps).toHaveLength(7);
          
          // Property: Steps must have the exact labels in order
          const actualLabels = steps.map(s => s.label);
          expect(actualLabels).toEqual(expectedLabels);
          
          // Property: All steps must be required
          expect(steps.every(s => s.isRequired)).toBe(true);
          
          // Property: Steps must be ordered correctly (order field matches position)
          steps.forEach((step, index) => {
            expect(step.order).toBe(index + 1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: vistoria-guiada, Property 15: Cavalo 6x2 equivale a Cavalo 6x4
   * Validates: Requirements 6.2
   * 
   * This property verifies that Cavalo 6x2 and Cavalo 6x4 have identical step sequences.
   */
  it('Property 15: Cavalo 6x2 should have identical steps to Cavalo 6x4', () => {
    fc.assert(
      fc.property(
        fc.constant({ model6x4: VehicleModel.CAVALO_6X4, model6x2: VehicleModel.CAVALO_6X2 }),
        ({ model6x4, model6x2 }) => {
          const steps6x4 = getStepsForModel(model6x4);
          const steps6x2 = getStepsForModel(model6x2);
          
          // Property: Both must have the same length
          expect(steps6x2.length).toBe(steps6x4.length);
          
          // Property: Labels must be identical in order
          const labels6x4 = steps6x4.map(s => s.label);
          const labels6x2 = steps6x2.map(s => s.label);
          expect(labels6x2).toEqual(labels6x4);
          
          // Property: Instructions must be identical
          const instructions6x4 = steps6x4.map(s => s.instruction);
          const instructions6x2 = steps6x2.map(s => s.instruction);
          expect(instructions6x2).toEqual(instructions6x4);
          
          // Property: Required status must be identical
          const required6x4 = steps6x4.map(s => s.isRequired);
          const required6x2 = steps6x2.map(s => s.isRequired);
          expect(required6x2).toEqual(required6x4);
          
          // Property: They should reference the same array
          expect(VEHICLE_MODEL_STEPS[model6x2]).toBe(VEHICLE_MODEL_STEPS[model6x4]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: vistoria-guiada, Property 16: Rodotrem 9 Eixos tem 6 etapas específicas
   * Validates: Requirements 6.3
   * 
   * This property verifies that the Carreta Rodotrem 9 Eixos model always returns
   * exactly 6 steps with the specific labels in the correct order.
   */
  it('Property 16: Rodotrem 9 Eixos should have exactly 6 specific steps in order', () => {
    const expectedLabels = [
      'Vista frontal completa do conjunto',
      'Lateral esquerda completa',
      'Lateral direita completa',
      'Traseira completa',
      'Posição dos eixos',
      'Pneus detalhe (mínimo 4 fotos)'
    ];

    fc.assert(
      fc.property(
        fc.constant(VehicleModel.CARRETA_RODOTREM_9_EIXOS),
        (model) => {
          const steps = getStepsForModel(model);
          
          // Property: Must have exactly 6 steps
          expect(steps).toHaveLength(6);
          
          // Property: Steps must have the exact labels in order
          const actualLabels = steps.map(s => s.label);
          expect(actualLabels).toEqual(expectedLabels);
          
          // Property: All steps must be required
          expect(steps.every(s => s.isRequired)).toBe(true);
          
          // Property: Steps must be ordered correctly (order field matches position)
          steps.forEach((step, index) => {
            expect(step.order).toBe(index + 1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: vistoria-guiada, Property 17: Graneleiro adiciona etapa de lona
   * Validates: Requirements 6.4
   * 
   * This property verifies that the Carreta Rodotrem Graneleiro model contains
   * all 6 steps from Rodotrem 9 Eixos plus an additional step for the tarp/cover,
   * totaling 7 steps.
   */
  it('Property 17: Graneleiro should have Rodotrem 9 Eixos steps plus tarp step', () => {
    fc.assert(
      fc.property(
        fc.constant({
          graneleiro: VehicleModel.CARRETA_RODOTREM_GRANELEIRO,
          rodotrem: VehicleModel.CARRETA_RODOTREM_9_EIXOS
        }),
        ({ graneleiro, rodotrem }) => {
          const graneleiroSteps = getStepsForModel(graneleiro);
          const rodotremSteps = getStepsForModel(rodotrem);
          
          // Property: Graneleiro must have exactly 7 steps (6 + 1)
          expect(graneleiroSteps).toHaveLength(7);
          expect(rodotremSteps).toHaveLength(6);
          
          // Property: First 6 steps must match Rodotrem 9 Eixos exactly
          const first6Labels = graneleiroSteps.slice(0, 6).map(s => s.label);
          const rodotremLabels = rodotremSteps.map(s => s.label);
          expect(first6Labels).toEqual(rodotremLabels);
          
          // Property: 7th step must be the tarp/cover detail
          const seventhStep = graneleiroSteps[6];
          expect(seventhStep.label).toBe('Detalhe da lona ou tampa superior');
          expect(seventhStep.order).toBe(7);
          expect(seventhStep.isRequired).toBe(true);
          
          // Property: All steps must be required
          expect(graneleiroSteps.every(s => s.isRequired)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
