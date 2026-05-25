const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgFile = path.join(__dirname, 'public', 'logo.svg');

async function convertSVG() {
  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 }, // standard Apple touch icon size
  ];

  try {
    const svgBuffer = fs.readFileSync(svgFile);

    for (const item of sizes) {
      const outPath = path.join(__dirname, 'public', item.name);
      await sharp(svgBuffer)
        .resize(item.size, item.size)
        .png()
        .toFile(outPath);
      console.log(`Generated ${item.name}`);
    }
  } catch (error) {
    console.error('Error generating images:', error);
  }
}

convertSVG();
