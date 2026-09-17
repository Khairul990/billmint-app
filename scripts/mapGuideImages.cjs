#!/usr/bin/env node
// One-shot: map tutorial guides to real captured screenshots (safe, single pass).
const fs = require('fs');
const path = require('path');
const FILE = path.resolve(__dirname, '..', 'src', 'data', 'guides.js');

let src = fs.readFileSync(FILE, 'utf8');

// 1) create-first-invoice already has image refs (step1-4.png) — replace them.
const cif = ["'/guides/g-dashboard.jpg'", "'/guides/g-create-invoice.jpg'", "'/guides/g-create-invoice.jpg'", "'/guides/g-create-invoice.jpg'"];
let ci = 0;
src = src.replace(/image: '(\/guides\/step\d\.png)'/g, () => 'image: ' + cif[Math.min(ci++, cif.length - 1)]);

// 2) Guides without image fields — insert after each descriptionEn line.
const guideImg = {
  'add-customer': '/guides/g-customers.jpg',
  'track-payments': '/guides/g-due.jpg',
  'change-theme': '/guides/g-settings.jpg',
  'live-payment-link': '/guides/g-create-invoice.jpg',
  'add-product': '/guides/g-products.jpg',
  'business-profile': '/guides/g-settings.jpg',
  'backup-data': '/guides/g-backup.jpg',
};

const out = [];
let imgForGuide = null;
for (const line of src.split('\n')) {
  const m = line.match(/^\s{4}id: '([a-z-]+)',/);
  if (m) imgForGuide = guideImg[m[1]] || null;
  out.push(line);
  if (imgForGuide && /^\s{8}descriptionEn:/.test(line)) {
    out.push(line.match(/^\s{8}/)[0] + "image: '" + imgForGuide + "',");
  }
}
fs.writeFileSync(FILE, out.join('\n'));
console.log('guides.js image mapping done');
