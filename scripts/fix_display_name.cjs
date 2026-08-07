const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));

let filesFixed = 0;

results.forEach(result => {
  const displayNameErrors = result.messages.filter(m => m.ruleId === 'react/display-name');
  if (displayNameErrors.length === 0) return;

  let content = fs.readFileSync(result.filePath, 'utf8');
  let lines = content.split('\n');
  let modifications = [];

  displayNameErrors.forEach(err => {
    // Look at the line with the error
    const lineIndex = err.line - 1;
    let line = lines[lineIndex];

    // Try to find the component name. Usually it's:
    // const MyComponent = memo(...) or const MyComponent = forwardRef(...)
    // or export const MyComponent = ...
    
    // Check if it's a variable assignment
    const match = line.match(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:React\.)?(?:memo|forwardRef)/);
    
    if (match) {
      const compName = match[1];
      modifications.push({ name: compName, insertAfterLine: lineIndex });
    }
  });

  if (modifications.length > 0) {
    // Append the displayName assignments at the very end of the file
    let newContent = content;
    
    // Prevent adding duplicates if we run this multiple times
    const existingAppends = [];
    
    modifications.forEach(mod => {
       const appendStr = `\n${mod.name}.displayName = '${mod.name}';`;
       if (!newContent.includes(`${mod.name}.displayName =`)) {
          newContent += appendStr;
       }
    });

    if (newContent !== content) {
       fs.writeFileSync(result.filePath, newContent);
       console.log(`Fixed display names in ${path.basename(result.filePath)}`);
       filesFixed++;
    }
  }
});

console.log(`Finished fixing ${filesFixed} files.`);
