import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Testando configuração PWA...\n');

// Test 1: Verificar manifest.json
console.log('1️⃣ Verificando manifest.json...');
const manifestPath = join(__dirname, 'public', 'manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  console.log('   ✓ Manifest encontrado');
  console.log(`   ✓ Nome: ${manifest.name}`);
  console.log(`   ✓ ID: ${manifest.id || 'NÃO DEFINIDO'}`);
  console.log(`   ✓ Ícones: ${manifest.icons?.length || 0}`);
  console.log(`   ✓ Screenshots: ${manifest.screenshots?.length || 0}`);
  
  if (!manifest.id) {
    console.log('   ⚠️  AVISO: Campo "id" não definido no manifest');
  }
  
  // Verificar ícones
  manifest.icons?.forEach(icon => {
    const iconPath = join(__dirname, 'public', icon.src.replace('/', ''));
    if (existsSync(iconPath)) {
      console.log(`   ✓ Ícone ${icon.sizes} encontrado: ${icon.src}`);
    } else {
      console.log(`   ✗ Ícone ${icon.sizes} NÃO encontrado: ${icon.src}`);
    }
  });
} else {
  console.log('   ✗ Manifest NÃO encontrado');
}

// Test 2: Verificar Service Worker
console.log('\n2️⃣ Verificando Service Worker...');
const swPath = join(__dirname, 'dist', 'sw.js');
if (existsSync(swPath)) {
  console.log('   ✓ Service Worker gerado (dist/sw.js)');
  const swContent = readFileSync(swPath, 'utf-8');
  console.log(`   ✓ Tamanho: ${(swContent.length / 1024).toFixed(2)} KB`);
} else {
  console.log('   ⚠️  Service Worker não encontrado (execute npm run build primeiro)');
}

// Test 3: Verificar index.html
console.log('\n3️⃣ Verificando index.html...');
const indexPath = join(__dirname, 'index.html');
if (existsSync(indexPath)) {
  const indexContent = readFileSync(indexPath, 'utf-8');
  
  const checks = [
    { name: 'Favicon', pattern: /favicon\.png/ },
    { name: 'Manifest link', pattern: /manifest\.json/ },
    { name: 'Theme color', pattern: /theme-color/ },
    { name: 'Apple touch icon', pattern: /apple-touch-icon/ },
    { name: 'Viewport', pattern: /viewport/ },
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(indexContent)) {
      console.log(`   ✓ ${check.name} configurado`);
    } else {
      console.log(`   ✗ ${check.name} NÃO configurado`);
    }
  });
} else {
  console.log('   ✗ index.html NÃO encontrado');
}

// Test 4: Verificar vite.config.ts
console.log('\n4️⃣ Verificando vite.config.ts...');
const viteConfigPath = join(__dirname, 'vite.config.ts');
if (existsSync(viteConfigPath)) {
  const viteConfig = readFileSync(viteConfigPath, 'utf-8');
  
  if (viteConfig.includes('VitePWA')) {
    console.log('   ✓ Plugin VitePWA configurado');
  } else {
    console.log('   ✗ Plugin VitePWA NÃO configurado');
  }
  
  if (viteConfig.includes('registerType')) {
    console.log('   ✓ Registro automático configurado');
  }
  
  if (viteConfig.includes('workbox')) {
    console.log('   ✓ Workbox configurado');
  }
} else {
  console.log('   ✗ vite.config.ts NÃO encontrado');
}

// Test 5: Verificar main.tsx
console.log('\n5️⃣ Verificando main.tsx...');
const mainPath = join(__dirname, 'src', 'main.tsx');
if (existsSync(mainPath)) {
  const mainContent = readFileSync(mainPath, 'utf-8');
  
  if (mainContent.includes('virtual:pwa-register')) {
    console.log('   ✓ Service Worker registrado no main.tsx');
  } else {
    console.log('   ⚠️  Service Worker NÃO registrado no main.tsx');
  }
  
  if (mainContent.includes('onNeedRefresh')) {
    console.log('   ✓ Atualização automática configurada');
  }
  
  if (mainContent.includes('onOfflineReady')) {
    console.log('   ✓ Modo offline configurado');
  }
} else {
  console.log('   ✗ main.tsx NÃO encontrado');
}

console.log('\n✅ Verificação concluída!\n');
console.log('📝 Próximos passos:');
console.log('   1. Execute: npm run build');
console.log('   2. Execute: npm run preview');
console.log('   3. Teste no navegador: http://localhost:4173');
console.log('   4. Abra DevTools > Application > Service Workers');
console.log('   5. Verifique o Lighthouse score para PWA\n');
