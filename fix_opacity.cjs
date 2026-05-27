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

  // Replace invalid opacity combinations like bg-theme-accent/10
  content = content.replace(/bg-theme-accent\/10/g, 'bg-theme-softAccent');
  content = content.replace(/bg-theme-accent\/20/g, 'bg-theme-softAccent');
  content = content.replace(/bg-theme-accent\/5/g, 'bg-theme-softAccent');
  
  // Replace border opacities
  content = content.replace(/border-theme-accent\/20/g, 'border-theme-border');
  content = content.replace(/border-theme-accent\/30/g, 'border-theme-border');
  content = content.replace(/border-theme-accent\/50/g, 'border-theme-border');
  content = content.replace(/border-theme-accent\/60/g, 'border-theme-border');
  
  // Replace text opacities or other tailwind classes
  content = content.replace(/shadow-theme-accent\/20/g, 'shadow-premium');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated opacity classes: ${file}`);
  }
});
console.log('Done fixing opacity classes.');
