const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Empty catch block with unused var -> catch (e) { console.warn(e); }
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{\s*\}/g, 'catch ($1) { console.warn($1); }');

  // 2. Unused var in catch block -> catch { ... }
  // Only applies if the block doesn't use the variable.
  // Using a simple regex to find the variable in the block (assumes block ends with } but could have nested {})
  // This might be tricky with nested {}, so let's stick to simple single-level {} or just rely on a safer regex
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{([^}]*)\}/g, (match, p1, p2) => {
    const regex = new RegExp('\\b' + p1 + '\\b');
    if (!regex.test(p2)) {
      return 'catch {' + p2 + '}';
    }
    return match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
console.log('Finished updating catch blocks.');
