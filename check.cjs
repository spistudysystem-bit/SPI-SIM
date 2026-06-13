const fs = require('fs');

const indexCss = fs.readFileSync('src/index.css', 'utf8');
const allFiles = fs.readdirSync('src/components/modules').map(f => 'src/components/modules/' + f)
allFiles.push('src/App.tsx');

const regex = /bg-\[#([a-f0-9]{6})\]/g;
let missing = new Set();

for(const f of allFiles) {
  if(!f.endsWith('.tsx')) continue;
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    const hex = match[1];
    if (hex === '00d1ff' || hex === 'ffd700' || hex === 'ea580c' || hex === 'ef4444' || hex === 'eab308' || hex === '3b82f6') continue; // Skip brand colors
    if (!indexCss.includes(`bg-\\[#${hex}\\]`) && !indexCss.includes(`bg-[#${hex}]`)) {
      missing.add(hex);
    }
  }
}

console.log('Missing backgrounds:', Array.from(missing).join(', '));
