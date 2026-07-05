const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('src');
let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{\s*\}/g, (match, varName) => {
    return `catch (${varName}) { console.warn('Ignored error in ${path.basename(file)}:', ${varName}); }`;
  });
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed empty catch blocks in:', file);
    fixed++;
  }
});

console.log('Total files fixed:', fixed);
