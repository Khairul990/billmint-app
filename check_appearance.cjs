const fs = require('fs'); 
const code = fs.readFileSync('src/pages/Settings.jsx', 'utf-8'); 
const start = code.indexOf('id="appearance"'); 
console.log(code.substring(start, start + 1000));
