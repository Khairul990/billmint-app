const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('src');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/([a-zA-Z]+Engine)\.\1\./g, '$1.');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed redundant engine call in ' + file);
  }
}
