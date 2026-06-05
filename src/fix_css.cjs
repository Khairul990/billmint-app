const fs = require('fs');
let css = fs.readFileSync('e:/Khair_Murafiq_Empire/BillQyro/src/index.css', 'utf-8');
css = css.replace(/\\n/g, '\n');
fs.writeFileSync('e:/Khair_Murafiq_Empire/BillQyro/src/index.css', css);
