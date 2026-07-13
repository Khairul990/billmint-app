const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '../dist')));

const server = app.listen(3000, async () => {
  console.log('Server running on 3000');
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully without crashing immediately.');
    await browser.close();
  } catch (err) {
    console.error('Puppeteer Error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
