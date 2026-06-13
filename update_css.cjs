import fs from 'fs';

const darkHexes = [
  '12141a', '07080b', '13161c', '121c24', '030308', '111216', '08090c', '0e1014', '0c0d12', '060709', '101217', 
  '101115', '14151a', '22242a', '030304', '08080a', '181a1f', '050608', '151922', '181d24', '1e2330', '2b3145', 
  '1c2c36', '1c2130', '1b1e26', '181b24', '171a22', '101216', '14161c', '090b0e', '121317', '1c1d24', '0c0d11', 
  '121319', '111318', '0e1013', '181a20', '1c1416', '0e0f12', '191b22', '1c1813', '1c1f26', '151515', '121217', 
  '1b1c24', '0d1117', '0d0d12', '1c1e24', '1b1e25', '11131a', '0d0e12', '1a1d26'
];

let indexCss = fs.readFileSync('src/index.css', 'utf8');

const additions = darkHexes.filter(hex => !indexCss.includes(`bg-\\[#${hex}\\]`))
  .map(hex => `.daylight .bg-\\[\\#${hex}\\],\n.daylight [class*="bg-[#${hex}]"]`)
  .join(',\n');

if (additions) {
  indexCss = indexCss.replace('/* --- Bulletproof Daylight Contrast Attribute Overrides --- */', 
    '/* --- Bulletproof Daylight Contrast Attribute Overrides --- */\n' + additions + ' {\n  background-color: #f3f4f6 !important;\n  border-color: #cbd5e1 !important;\n}\n');
  fs.writeFileSync('src/index.css', indexCss);
  console.log('Updated index.css with missing dark backgrounds.');
} else {
  console.log('No updates needed.');
}
