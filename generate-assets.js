import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgContent = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.svg'), 'utf-8');

// Write the identical SVG files
fs.writeFileSync(path.join(process.cwd(), 'public', 'app-icon.svg'), svgContent);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(process.cwd(), 'public', 'icons.svg'), svgContent);

// Generate PNGs using Sharp
async function generatePNGs() {
  const baseSvgBuffer = Buffer.from(svgContent);

  // apple-touch-icon.png (180x180)
  await sharp(baseSvgBuffer, { density: 300 })
    .resize(180, 180)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'apple-touch-icon.png'));

  // pwa-192x192.png
  await sharp(baseSvgBuffer, { density: 300 })
    .resize(192, 192)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'pwa-192x192.png'));

  // pwa-512x512.png
  await sharp(baseSvgBuffer, { density: 600 })
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'pwa-512x512.png'));

  console.log('Successfully generated all icon files.');
}

generatePNGs().catch(console.error);
