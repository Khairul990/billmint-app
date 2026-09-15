const fs = require('fs');
let code = fs.readFileSync('src/services/paymentEngine.js', 'utf8');
code = code.split('$'+'{ev__}$'+'{paymentId}_$'+'{Date.now()}').join('ev_$'+'{paymentId}_$'+'{Date.now()}');
fs.writeFileSync('src/services/paymentEngine.js', code);
console.log('Node fix done');