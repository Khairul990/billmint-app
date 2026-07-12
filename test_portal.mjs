import { chromium } from '@playwright/test';
import { exec } from 'child_process';

const testPortal = async () => {
  console.log("Starting dev server...");
  const server = exec('npm run dev -- --port 5173');
  
  await new Promise(r => setTimeout(r, 4000));
  
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('UNHANDLED EXCEPTION:', err.message);
  });
  
  console.log("Navigating to portal...");
  // Use a dummy ID so it shows CustomerPortalLogin, then we force session data to bypass login and trigger the crash
  await page.goto('http://localhost:5173/customer/c-1783843778723-w8ya6');
  
  // Set session storage to bypass login
  await page.evaluate(() => {
    sessionStorage.setItem('billqyro_customer_portal_id', 'c-1783843778723-w8ya6');
    sessionStorage.setItem('billqyro_customer_portal_phone', '9876543210');
  });
  
  // Reload to apply session and trigger CustomerWorkspace render
  await page.reload();
  
  console.log("Waiting 3 seconds for crash to occur...");
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
  server.kill();
  console.log("Test finished.");
};

testPortal().catch(console.error);
