const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // In Layout.jsx, we want to remove the redundant themeColor state entirely
      if (file === 'Layout.jsx') {
        code = code.replace(/const \[themeColor, setThemeColor\] = useState[^;]+;/g, '');
        code = code.replace(/setThemeColor\([^)]+\);/g, '');
        code = code.replace(/updateFaviconForTheme[^;]+;/g, '');
        code = code.replace(/document\.documentElement\.setAttribute\('data-theme'[^;]+;/g, '');
        code = code.replace(/document\.documentElement\.classList\.(add|remove)\('dark'\);/g, '');
        changed = true;
      }
      
      // Generic replacements for manual DOM manipulation everywhere
      if (code.includes('document.documentElement.setAttribute(\'data-theme\'')) {
        code = code.replace(/document\.documentElement\.setAttribute\('data-theme'[^;]+;/g, '// Handled by ThemeContext');
        changed = true;
      }
      if (code.includes('document.documentElement.classList.add(\'dark\')')) {
        code = code.replace(/document\.documentElement\.classList\.add\('dark'\);/g, '// Handled by ThemeContext');
        changed = true;
      }
      if (code.includes('document.documentElement.classList.remove(\'dark\')')) {
        code = code.replace(/document\.documentElement\.classList\.remove\('dark'\);/g, '// Handled by ThemeContext');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, code);
        console.log('Fixed themes in', fullPath);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
