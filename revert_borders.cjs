const fs = require('fs');

const file = 'src/index.css';
let content = fs.readFileSync(file, 'utf8');

function hexToRgb(hex) {
    hex = hex.replace('#', '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16)
    };
}

const blocks = content.split(/(\.dark[^\{]*\{[\s\S]*?\n  \})/);

for (let i = 1; i < blocks.length; i += 2) {
    let block = blocks[i];
    
    // find accent
    const accentMatch = block.match(/--accent:\s*(#[0-9A-Fa-f]{6});/);
    if (accentMatch) {
        const hex = accentMatch[1];
        const { r, g, b } = hexToRgb(hex);
        
        block = block.replace(/--border-soft:\s*#233347;/, \`--border-soft: rgba(\${r},\${g},\${b},0.22);\`);
        block = block.replace(/--border-strong:\s*#233347;/, \`--border-strong: rgba(\${r},\${g},\${b},0.4);\`);
        
        blocks[i] = block;
    }
}

fs.writeFileSync(file, blocks.join(''), 'utf8');
console.log('Successfully reverted dark mode borders to theme accent colors!');
