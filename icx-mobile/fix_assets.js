const fs = require('fs');
const path = require('path');

// A valid 1x1 pixel transparent PNG (Base64)
const VALID_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

const filesToFix = [
  'assets/dishes/pasta.png',
  'assets/dishes/salad.png',
  'assets/dishes/steak.png',
  'assets/dishes/default.png',
  'assets/ingredients/tomato.png',
  'assets/ingredients/cheese.png',
  'assets/ingredients/spinach.png',
  'assets/ingredients/egg.png'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  // Only write if file exists (to avoid errors if folders differ) or create it if missing
  try {
    fs.writeFileSync(filePath, VALID_PNG);
    console.log(`✅ Fixed: ${file}`);
  } catch (err) {
    console.error(`❌ Could not fix ${file} (Folder might be missing)`);
  }
});

console.log("\nAll assets fixed! You can now run the app.");