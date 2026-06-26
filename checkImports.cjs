const fs = require('fs');

function findFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(findFiles(file, ext));
    } else { 
      if (file.endsWith(ext)) results.push(file);
    }
  });
  return results;
}

const files = findFiles('./src', '.jsx').concat(findFiles('./src', '.js'));

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('<Users')) {
    const hasUsersImport = /import\s+[^;]*\bUsers\b[^;]*from/.test(content);
    if (!hasUsersImport) {
      console.log('MISSING Users import in ' + f);
    }
  }
});
