const fs = require('fs');
const index = fs.readFileSync('e:/Khair_Murafiq_Empire/BillQyro/src/index.css', 'utf-8');
const themes = fs.readFileSync('e:/Khair_Murafiq_Empire/BillQyro/src/themes.css', 'utf-8');

const startIdx = index.indexOf('  /* 9. Sunset Orange */');
const endIdx = index.indexOf('  body {');

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = index.substring(0, startIdx) + themes + '\n\n' + index.substring(endIdx);
    fs.writeFileSync('e:/Khair_Murafiq_Empire/BillQyro/src/index.css', newContent);
    console.log("Replaced successfully");
} else {
    console.log("Could not find boundaries");
}
