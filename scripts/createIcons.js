const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');
const { createCanvas } = require('canvas');

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Function to create a simple colored circle PNG
function createPNG(color, size, outputPath) {
  const Canvas = require('canvas');
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Clear background (transparent)
  ctx.clearRect(0, 0, size, size);

  // Draw circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 2, 0, Math.PI * 2);
  ctx.fill();

  // Save PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Created: ${outputPath}`);
}

// Function to convert PNG to ICO
async function convertToICO(pngPath, icoPath) {
  try {
    const buf = await pngToIco(pngPath);
    fs.writeFileSync(icoPath, buf);
    console.log(`Converted to ICO: ${icoPath}`);
  } catch (error) {
    console.error(`Error converting ${pngPath}:`, error.message);
  }
}

// Create icons
const icons = [
  { name: 'idle', color: '#666666' },
  { name: 'recording', color: '#e74c3c' },
  { name: 'transcribing', color: '#f39c12' }
];

async function createAllIcons() {
  for (const icon of icons) {
    const pngPath = path.join(iconsDir, `${icon.name}.png`);
    const icoPath = path.join(iconsDir, `${icon.name}.ico`);
    
    // Create PNG at 32x32 (good size for tray icons)
    createPNG(icon.color, 32, pngPath);
    
    // Convert to ICO
    await convertToICO(pngPath, icoPath);
  }
  
  console.log('\nAll icons created successfully!');
}

createAllIcons().catch(console.error);
