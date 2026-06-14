const fs = require('fs');

const targetFile = 'e:/Khair_Murafiq_Empire/BillQyro/src/index.css';
let content = fs.readFileSync(targetFile, 'utf8');

// Split the file into dark blocks and other text
const parts = content.split(/(\.dark[^\{]*\{[\s\S]*?\n  \})/);

for (let i = 1; i < parts.length; i += 2) {
    let block = parts[i];
    
    block = block.replace(/--app-bg:\s*[^;]+;/, '--app-bg: #0B1118;');
    block = block.replace(/--app-bg-soft:\s*[^;]+;/, '--app-bg-soft: #111827;');
    block = block.replace(/--surface:\s*[^;]+;/, '--surface: #111827;');
    block = block.replace(/--surface-elevated:\s*[^;]+;/, '--surface-elevated: #162131;');
    block = block.replace(/--card-bg:\s*[^;]+;/, '--card-bg: #111827;');
    block = block.replace(/--text-primary:\s*[^;]+;/, '--text-primary: #F9FAFB;');
    block = block.replace(/--text-secondary:\s*[^;]+;/, '--text-secondary: #AAB7C4;');
    block = block.replace(/--text-muted:\s*[^;]+;/, '--text-muted: #7A8896;');
    block = block.replace(/--border-soft:\s*[^;]+;/, '--border-soft: #233347;');
    block = block.replace(/--border-strong:\s*[^;]+;/, '--border-strong: #233347;');
    block = block.replace(/--sidebar-bg:\s*[^;]+;/, '--sidebar-bg: #0B1118;');
    block = block.replace(/--sidebar-text:\s*[^;]+;/, '--sidebar-text: #F9FAFB;');
    block = block.replace(/--input-bg:\s*[^;]+;/, '--input-bg: #111827;');
    
    parts[i] = block;
}

fs.writeFileSync(targetFile, parts.join(''), 'utf8');
console.log('Successfully updated index.css dark themes safely!');
