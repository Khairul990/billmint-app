const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(dirPath, file).replace(/\\/g, '/'));
      }
    }
  });
  return arrayOfFiles;
}

const allFiles = getAllFiles('src');
const fileContents = allFiles.map(f => ({ path: f, content: fs.readFileSync(f, 'utf8') }));

const orphanedFiles = [];
allFiles.forEach(file => {
  if (file.endsWith('main.jsx') || file.endsWith('App.jsx') || file.endsWith('index.jsx')) return;
  
  const basename = path.basename(file, path.extname(file));
  let isImported = false;
  
  for (let fileObj of fileContents) {
    if (fileObj.path === file) continue; // Don't check self
    if (fileObj.content.includes(basename)) {
      isImported = true;
      break;
    }
  }
  
  if (!isImported) {
    orphanedFiles.push(file);
  }
});

console.log('Orphaned Files:');
orphanedFiles.forEach(f => console.log(' - ' + f));
