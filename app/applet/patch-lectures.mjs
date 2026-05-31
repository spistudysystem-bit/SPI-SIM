import fs from 'fs';

const filePath = './src/constants/lectures.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace all occurrences of: The "Holy Sh*t" Insight
const updatedContent = content.replace(/The "Holy Sh\*t" Insight/g, 'The "Critical" Insight');

if (updatedContent !== content) {
  fs.writeFileSync(filePath, updatedContent);
  console.log('Successfully updated src/constants/lectures.ts to replace the phrase!');
} else {
  console.log('No matches found to replace in src/constants/lectures.ts');
}
