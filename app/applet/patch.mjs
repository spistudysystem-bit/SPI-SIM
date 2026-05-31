import fs from 'fs';
import path from 'path';

const dir = './src/components/modules';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace `overflow-hidden` with `overflow-y-auto xl:overflow-hidden` 
    // where it's part of the main `motion.div` module wrapper.
    if (content.includes('xl:flex-row') && content.includes('overflow-hidden')) {
      content = content.replace(/xl:flex-row([^"']*)overflow-hidden/g, 'xl:flex-row$1overflow-y-auto xl:overflow-hidden');
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    } else {
        // Just general fix. We only want it for the top level usually, which has `flex-1`
        let newContent = content.replace(/className="((?:[^"]*)flex-1(?:.*?)overflow-)hidden([^"]*)"/g, 'className="$1y-auto xl:overflow-hidden$2"');
        if (newContent !== content) {
          fs.writeFileSync(filePath, newContent);
          console.log(`Updated general ${file}`);
        }
    }
  }
});
