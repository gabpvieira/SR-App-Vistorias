/**
 * Verification utilities for guided inspection types
 * This file helps verify that the implementation matches requirements
 */

import { 
  VehicleModel, 
  VEHICLE_MODEL_LABELS, 
  getStepsForModel 
} from '../types/guided-inspection';

/**
 * Verify that all vehicle models have exactly 5 options
 * Requirement 1.2
 */
export function verifyVehicleModelCount(): boolean {
  const models = Object.values(VehicleModel);
  return models.length === 5;
}

/**
 * Verify that Cavalo 6x4 has exactly 7 steps with correct labels
 * Requirement 6.1
 */
export function verifyCavalo6x4Steps(): boolean {
  const steps = getStepsForModel(VehicleModel.CAVALO_6X4);
  const expectedLabels = [
    'Foto Frontal (ângulo 45º)',
    'Lateral esquerda completa',
    'Lateral direita completa',
    'Traseira (caixa)',
    'Painel interno (odômetro)',
    'Chassi lado esquerdo',
    'Chassi lado direito'
  ];
  
  if (steps.length !== 7) return false;
  
  return steps.every((step, index) => step.label === expectedLabels[index]);
}

/**
 * Verify that Cavalo 6x2 has the same steps as Cavalo 6x4
 * Requirement 6.2
 */
export function verifyCavalo6x2EqualsTo6x4(): boolean {
  const steps6x4 = getStepsForModel(VehicleModel.CAVALO_6X4);
  const steps6x2 = getStepsForModel(VehicleModel.CAVALO_6X2);
  
  if (steps6x4.length !== steps6x2.length) return false;
  
  return steps6x4.every((step, index) => 
    step.label === steps6x2[index].label &&
    step.instruction === steps6x2[index].instruction
  );
}

/**
 * Verify that Rodotrem 9 Eixos has exactly 6 steps with correct labels
 * Requirement 6.3
 */
export function verifyRodotrem9EixosSteps(): boolean {
  const steps = getStepsForModel(VehicleModel.CARRETA_RODOTREM_9_EIXOS);
  const expectedLabels = [
    'Vista frontal completa do conjunto',
    'Lateral esquerda completa',
    'Lateral direita completa',
    'Traseira completa',
    'Posição dos eixos',
    'Pneus detalhe (mínimo 4 fotos)'
  ];
  
  if (steps.length !== 6) return false;
  
  return steps.every((step, index) => step.label === expectedLabels[index]);
}

/**
 * Verify that Rodotrem Graneleiro has 7 steps (6 from Rodotrem + 1 extra)
 * Requirement 6.4
 */
export function verifyRodotremGraneleiroSteps(): boolean {
  const steps = getStepsForModel(VehicleModel.CARRETA_RODOTREM_GRANELEIRO);
  const rodotremSteps = getStepsForModel(VehicleModel.CARRETA_RODOTREM_9_EIXOS);
  
  if (steps.length !== 7) return false;
  
  // First 6 steps should match Rodotrem 9 Eixos
  const first6Match = steps.slice(0, 6).every((step, index) => 
    step.label === rodotremSteps[index].label
  );
  
  // 7th step should be the tarp detail
  const has7thStep = steps[6].label === 'Detalhe da lona ou tampa superior';
  
  return first6Match && has7thStep;
}

/**
 * Verify that Livre mode has no predefined steps
 * Requirement 3.1
 */
export function verifyLivreModeHasNoSteps(): boolean {
  const steps = getStepsForModel(VehicleModel.LIVRE);
  return steps.length === 0;
}

/**
 * Run all verifications and return results
 */
export function runAllVerifications(): Record<string, boolean> {
  return {
    'Vehicle model count (5 options)': verifyVehicleModelCount(),
    'Cavalo 6x4 has 7 steps': verifyCavalo6x4Steps(),
    'Cavalo 6x2 equals Cavalo 6x4': verifyCavalo6x2EqualsTo6x4(),
    'Rodotrem 9 Eixos has 6 steps': verifyRodotrem9EixosSteps(),
    'Rodotrem Graneleiro has 7 steps': verifyRodotremGraneleiroSteps(),
    'Livre mode has no steps': verifyLivreModeHasNoSteps()
  };
}

/**
 * Log verification results to console
 */
export function logVerificationResults(): void {
  const results = runAllVerifications();
  console.log('=== Guided Inspection Type Verification ===');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✓' : '✗'} ${test}`);
  });
  const allPassed = Object.values(results).every(r => r);
  console.log(`\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}
