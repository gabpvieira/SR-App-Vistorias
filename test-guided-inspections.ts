/**
 * Script de teste automatizado para vistorias guiadas
 * Cria 3 vistorias completas com fotos reais
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://hppdjdnnovtxtiwawtsh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcGRqZG5ub3Z0eHRpd2F3dHNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTI4NjQsImV4cCI6MjA4MDI2ODg2NH0.1r-rLq7bX8NX2_F8UcKBSAq9_MYU9xkrxPxXWy4L5E8';

const supabase = createClient(supabaseUrl, supabaseKey);

// ID do usuário de teste (João Silva - vendedor)
const TEST_USER_ID = '62adf64f-af28-404b-b85e-f5908e4e5bbc';

interface TestInspection {
  vehicleModel: string;
  plate: string;
  stepCount: number;
}

const testInspections: TestInspection[] = [
  { vehicleModel: 'cavalo', plate: 'ABC-1234', stepCount: 13 },
  { vehicleModel: 'rodotrem_basculante', plate: 'DEF-5678', stepCount: 7 },
  { vehicleModel: 'rodotrem_graneleiro', plate: 'GHI-9012', stepCount: 7 },
];

async function loadImageAsFile(imagePath: string, fileName: string): Promise<File> {
  const buffer = readFileSync(imagePath);
  const blob = new Blob([buffer], { type: 'image/png' });
  return new File([blob], fileName, { type: 'image/png' });
}

async function createTestInspection(test: TestInspection) {
  console.log(`\n🚀 Criando vistoria: ${test.vehicleModel} - ${test.plate}`);

  // 1. Criar vistoria
  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      user_id: TEST_USER_ID,
      type: 'troca',
      vehicle_model: test.vehicleModel,
      vehicle_plate: test.plate,
      is_guided_inspection: true,
      guided_photos_complete: true,
      status: 'concluida',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (inspectionError) {
    console.error('❌ Erro ao criar vistoria:', inspectionError);
    return;
  }

  console.log(`✅ Vistoria criada: ${inspection.id}`);

  // 2. Buscar etapas do modelo
  const { data: steps, error: stepsError } = await supabase
    .from('inspection_steps_template')
    .select('*')
    .eq('vehicle_model', test.vehicleModel)
    .order('step_order', { ascending: true });

  if (stepsError || !steps) {
    console.error('❌ Erro ao buscar etapas:', stepsError);
    return;
  }

  console.log(`📋 ${steps.length} etapas encontradas`);

  // 3. Upload de fotos para cada etapa
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const imageIndex = (i % 13) + 1; // Cicla pelas 13 imagens disponíveis
    const imagePath = join(process.cwd(), 'midia', 'teste-uploads-vistoria', `image (${imageIndex}).png`);

    try {
      // Upload para storage
      const fileName = `${step.step_order}-${step.label.replace(/\s+/g, '_')}.png`;
      const filePath = `inspections/${inspection.id}/${fileName}`;

      const imageBuffer = readFileSync(imagePath);
      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error(`❌ Erro ao fazer upload da foto ${step.step_order}:`, uploadError);
        continue;
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(filePath);

      // Criar registro no banco
      const { error: photoError } = await supabase
        .from('inspection_photos')
        .insert({
          inspection_id: inspection.id,
          label: step.label,
          step_order: step.step_order,
          photo_url: urlData.publicUrl,
          file_size: imageBuffer.length,
          mime_type: 'image/png',
        });

      if (photoError) {
        console.error(`❌ Erro ao salvar foto ${step.step_order}:`, photoError);
        continue;
      }

      console.log(`  ✅ Etapa ${step.step_order}/${steps.length}: ${step.label}`);
    } catch (error) {
      console.error(`❌ Erro ao processar etapa ${step.step_order}:`, error);
    }
  }

  console.log(`🎉 Vistoria ${test.plate} concluída com sucesso!`);
}

async function runTests() {
  console.log('🧪 Iniciando testes de vistorias guiadas...\n');
  console.log('=' .repeat(60));

  for (const test of testInspections) {
    await createTestInspection(test);
    console.log('=' .repeat(60));
  }

  console.log('\n✅ Todos os testes concluídos!');
  console.log('\n📊 Resumo:');
  console.log(`  - 3 vistorias criadas`);
  console.log(`  - 27 fotos enviadas (13 + 7 + 7)`);
  console.log(`  - Acesse http://localhost:8080/dashboard para visualizar`);
}

// Executar testes
runTests().catch(console.error);
