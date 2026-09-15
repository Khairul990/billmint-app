const fs = require('fs');
let code = fs.readFileSync('src/services/paymentEngine.js', 'utf8');
code = code.replace(/id: \\$\{ev__\}\$\{paymentId\}_\\$\{Date\.now\(\)\}\/, 'id: \ev_\$\{paymentId\}_\$\{Date.now()\}\');
fs.writeFileSync('src/services/paymentEngine.js', code);