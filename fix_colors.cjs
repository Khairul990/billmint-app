const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist;
};

const files = walkSync('e:/Billmint/src').filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/bg-emerald-500/g, 'bg-theme-accent');
  content = content.replace(/bg-indigo-600/g, 'bg-theme-accent');
  content = content.replace(/bg-indigo-500/g, 'bg-theme-accent');
  content = content.replace(/border-emerald-500/g, 'border-theme-accent');
  content = content.replace(/border-indigo-500/g, 'border-theme-accent');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
console.log('Done replacing hardcoded solid colors.');
