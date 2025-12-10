/**
 * Script para gerar ícones PWA em múltiplos tamanhos
 * 
 * Uso: node generate-pwa-icons.js
 * 
 * Requer: sharp (npm install sharp --save-dev)
 * 
 * Este script gera ícones nos tamanhos necessários para PWA
 * a partir de uma imagem fonte de alta resolução.
 */

const fs = require('fs');
const path = require('path');

// Tentar importar sharp, se não disponível, criar placeholders
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp não instalado. Criando ícones placeholder...');
  sharp = null;
}

// Configuração
const SOURCE_ICON = 'public/icon-512.png'; // Ícone fonte (maior resolução)
const OUTPUT_DIR = 'public';

// Tamanhos necessários para PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

/**
 * Gera um ícone em um tamanho específico
 */
async function generateIcon(sourcePath, outputPath, size) {
  if (!sharp) {
    // Criar arquivo placeholder se sharp não disponível
    console.log(`  [SKIP] ${outputPath} - sharp não disponível`);
    return false;
  }

  try {
    await sharp(sourcePath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  [OK] ${outputPath} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`  [ERRO] ${outputPath}: ${error.message}`);
    return false;
  }
}

/**
 * Gera ícone maskable com padding
 */
async function generateMaskableIcon(sourcePath, outputPath, size) {
  if (!sharp) {
    console.log(`  [SKIP] ${outputPath} - sharp não disponível`);
    return false;
  }

  try {
    // Maskable icons precisam de safe zone (10% padding)
    const safeSize = Math.floor(size * 0.8);
    const padding = Math.floor((size - safeSize) / 2);

    await sharp(sourcePath)
      .resize(safeSize, safeSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  [OK] ${outputPath} (${size}x${size} maskable)`);
    return true;
  } catch (error) {
    console.error(`  [ERRO] ${outputPath}: ${error.message}`);
    return false;
  }
}

/**
 * Verifica se o arquivo fonte existe
 */
function checkSourceFile() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Arquivo fonte não encontrado: ${SOURCE_ICON}`);
    console.log('\nPor favor, coloque uma imagem PNG de alta resolução (512x512 ou maior) em:');
    console.log(`  ${path.resolve(SOURCE_ICON)}`);
    return false;
  }
  return true;
}

/**
 * Copia ícone existente se os tamanhos forem iguais
 */
function copyIfExists(source, dest) {
  if (fs.existsSync(source) && source !== dest) {
    try {
      fs.copyFileSync(source, dest);
      console.log(`  [COPY] ${dest}`);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Função principal
 */
async function main() {
  console.log('=== Gerador de Ícones PWA ===\n');

  // Verificar arquivo fonte
  if (!checkSourceFile()) {
    // Tentar usar ícone existente como fonte
    const altSource = 'public/LOGO APP ICON.png';
    if (fs.existsSync(altSource)) {
      console.log(`Usando fonte alternativa: ${altSource}`);
    } else {
      console.log('\nCriando ícones placeholder baseados nos existentes...');
    }
  }

  console.log('\nGerando ícones padrão:');
  
  // Gerar ícones padrão
  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
    
    // Se já existe, pular
    if (fs.existsSync(outputPath)) {
      console.log(`  [EXISTS] ${outputPath}`);
      continue;
    }
    
    // Tentar copiar de ícone existente do mesmo tamanho
    const existingIcon = path.join(OUTPUT_DIR, `icon-${size}.png`);
    if (fs.existsSync(existingIcon)) {
      continue;
    }
    
    await generateIcon(SOURCE_ICON, outputPath, size);
  }

  console.log('\nGerando ícones maskable:');
  
  // Gerar ícones maskable
  for (const size of MASKABLE_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-maskable-${size}.png`);
    
    // Se já existe, pular
    if (fs.existsSync(outputPath)) {
      console.log(`  [EXISTS] ${outputPath}`);
      continue;
    }
    
    await generateMaskableIcon(SOURCE_ICON, outputPath, size);
  }

  console.log('\n=== Concluído ===');
  console.log('\nÍcones gerados em:', path.resolve(OUTPUT_DIR));
  console.log('\nSe os ícones não foram gerados, instale sharp:');
  console.log('  npm install sharp --save-dev');
  console.log('\nOu crie manualmente os seguintes arquivos:');
  
  for (const size of ICON_SIZES) {
    console.log(`  - icon-${size}.png (${size}x${size})`);
  }
  for (const size of MASKABLE_SIZES) {
    console.log(`  - icon-maskable-${size}.png (${size}x${size})`);
  }
}

// Executar
main().catch(console.error);
