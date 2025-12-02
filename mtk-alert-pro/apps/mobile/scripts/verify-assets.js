#!/usr/bin/env node
/**
 * MTK AlertPro - Asset Verification Script
 * Checks if all required assets exist before building
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets');

const REQUIRED_ASSETS = [
  {
    name: 'icon.png',
    purpose: 'Main app icon (iOS/Android)',
    minSize: 1024,
  },
  {
    name: 'splash-icon.png',
    purpose: 'Splash screen',
    minSize: 1000,
  },
  {
    name: 'adaptive-icon.png',
    purpose: 'Android adaptive icon',
    minSize: 1024,
  },
  {
    name: 'favicon.png',
    purpose: 'Web favicon',
    minSize: 48,
  },
  {
    name: 'notification-icon.png',
    purpose: 'Push notification icon',
    minSize: 96,
  },
];

console.log('🔍 MTK AlertPro - Asset Verification\n');
console.log('Checking assets in:', ASSETS_DIR, '\n');

let allExist = true;
let warnings = [];

REQUIRED_ASSETS.forEach((asset) => {
  const filePath = path.join(ASSETS_DIR, asset.name);
  const exists = fs.existsSync(filePath);

  if (exists) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ ${asset.name.padEnd(25)} (${sizeKB} KB) - ${asset.purpose}`);

    // Check if file is too small (might be placeholder)
    if (stats.size < 1000) {
      warnings.push(`⚠️  ${asset.name} is very small (${sizeKB} KB) - might be a placeholder`);
    }
  } else {
    console.log(`❌ ${asset.name.padEnd(25)} MISSING - ${asset.purpose}`);
    allExist = false;
  }
});

console.log('\n');

if (warnings.length > 0) {
  console.log('⚠️  Warnings:\n');
  warnings.forEach((warning) => console.log(warning));
  console.log('\n');
}

if (allExist) {
  console.log('✅ All required assets are present!\n');
  console.log('Next steps:');
  console.log('  1. Verify images look correct: ls -lh apps/mobile/assets/');
  console.log('  2. Test splash screen: pnpm dev');
  console.log('  3. Build APK to see app icon: eas build -p android --profile preview\n');
  process.exit(0);
} else {
  console.log('❌ Some assets are missing!\n');
  console.log('Please save your uploaded images to apps/mobile/assets/ with these names:');
  console.log('  - Image 1 (splash) → splash-icon.png');
  console.log('  - Image 2 (icon)   → icon.png');
  console.log('  - Image 3 (icon)   → adaptive-icon.png');
  console.log('  - Image 4 (icon)   → favicon.png');
  console.log('\nSee apps/mobile/assets/README.md for detailed instructions.\n');
  process.exit(1);
}
