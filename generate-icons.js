import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sourceIcon = join(__dirname, 'public', 'LOGO APP ICON.png');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
];

async function generateIcons() {
  console.log('Gerando ícones PWA...');
  
  for (const { name, size } of sizes) {
    const outputPath = join(__dirname, 'public', name);
    await sharp(sourceIcon)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`✓ ${name} (${size}x${size})`);
  }
  
  console.log('Ícones gerados com sucesso!');
}

generateIcons().catch(console.error);
