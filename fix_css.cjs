const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// For obsidian-gold light mode:
css = css.replace(/(:root,\s*\[data-theme="obsidian-gold"\]\s*\{)([^}]+)(\})/g, (match, p1, p2, p3) => {
    let replaced = p2
        .replace(/--app-bg:\s*#[0-9a-fA-F]+;/, '--app-bg: #FAF7F2;')
        .replace(/--app-bg-soft:\s*#[0-9a-fA-F]+;/, '--app-bg-soft: #FDFBF7;')
        .replace(/--surface:\s*#[0-9a-fA-F]+;/, '--surface: #FFFFFF;')
        .replace(/--surface-elevated:\s*#[0-9a-fA-F]+;/, '--surface-elevated: #F8FAFC;');
    return p1 + replaced + p3;
});

// For all other light themes (not .dark):
// We look for [data-theme="something"] { ... } 
css = css.replace(/(?:^|\n)([ \t]*)(?!.*\.dark.*)\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g, (match, indent, themeName, content) => {
    if (themeName === 'obsidian-gold') return match; // already handled
    let replaced = content
        .replace(/--surface:\s*#[0-9a-fA-F]+;/, '--surface: #FFFFFF;')
        .replace(/--surface-elevated:\s*#[0-9a-fA-F]+;/, '--surface-elevated: #F8FAFC;');
    return `\n${indent}[data-theme="${themeName}"] {${replaced}}`;
});

fs.writeFileSync('src/index.css', css);
console.log('Updated index.css');
