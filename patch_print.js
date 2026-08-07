import fs from 'fs';

let c = fs.readFileSync('src/index.css', 'utf8');

if (!c.includes('@media print')) {
  c += `\n\n@media print {
  body * {
    visibility: hidden;
  }
  .print-only-preview, .print-only-preview * {
    visibility: visible;
  }
  .print-only-preview {
    position: absolute;
    left: 0;
    top: 0;
    transform: scale(1) !important;
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
  }
}`;
  
  fs.writeFileSync('src/index.css', c);
  console.log('Print media queries added');
}
