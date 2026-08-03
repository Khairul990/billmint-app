import { test } from '@playwright/test';

test('diagnose whatsapp share in demo mode', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`[error] ${msg.text()}`); });
  page.on('pageerror', err => consoleErrors.push(`[pageerror] ${err.message}`));

  await page.addInitScript(() => {
    localStorage.setItem('billqyro_demo_session_active', 'true');
    localStorage.setItem('billqyro_demo_journey_mode', 'true');
    localStorage.setItem('billqyro_demo_logged_in', 'true');
    localStorage.setItem('billqyro_subscription', JSON.stringify({ status: 'premium', activatedAt: Date.now() }));
    window.__opened = [];
    const orig = window.open.bind(window);
    window.open = (url, target) => { window.__opened.push(url); return null; };
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);

  const bodyText = async () => (await page.locator('body').innerText()).replace(/\n{2,}/g, '\n');

  console.log('=== BODY (first 400) ===');
  console.log((await bodyText()).slice(0, 400));

  // Bypass paywall
  const bypass = page.locator('button:has-text("View Data & Pay Later"), button:has-text("Pay Later"), a:has-text("View Data")').first();
  if (await bypass.count()) { await bypass.click({ timeout: 8000 }).catch(()=>{}); await page.waitForTimeout(3000); }
  console.log('=== BODY AFTER BYPASS (first 300) ===');
  console.log((await bodyText()).slice(0, 300));

  // Sidebar invoice link
  const invItem = page.locator('button:has-text("Invoices"), a:has-text("Invoices"), div:has-text("Invoices")').first();
  await invItem.click({ timeout: 8000 }).catch(e => console.log('click invoices failed:', e.message));
  await page.waitForTimeout(5000);
  console.log('=== BODY AFTER INVOICES CLICK (first 500) ===');
  console.log((await bodyText()).slice(0, 500));

  // Look for "View" buttons or clickable invoice rows
  const viewButtons = page.locator('button[title*="View"], [title*="View Invoice"]');
  console.log('view buttons:', await viewButtons.count());
  if (await viewButtons.count()) {
    await viewButtons.first().click({ timeout: 8000 }).catch(e => console.log('click view failed:', e.message));
    await page.waitForTimeout(3000);
    console.log('=== BODY AFTER VIEW (first 600) ===');
    console.log((await bodyText()).slice(0, 600));
  }

  // Now click the WhatsApp share button (title "Share via WhatsApp")
  const waBtn = page.locator('[title="Share via WhatsApp"]').first();
  console.log('wa share buttons:', await waBtn.count());
  if (await waBtn.count()) {
    await waBtn.click({ timeout: 8000 }).catch(e => console.log('click wa failed:', e.message));
    await page.waitForTimeout(4000);
  } else {
    // try the quick share menu
    const shareMenuBtn = page.locator('[title="Share Invoice"]').first();
    if (await shareMenuBtn.count()) {
      await shareMenuBtn.click();
      await page.waitForTimeout(1500);
      const quick = page.locator('text=WhatsApp Share').first();
      if (await quick.count()) { await quick.click(); await page.waitForTimeout(4000); }
    }
  }

  console.log('=== OPENED URLs ===');
  const opened = await page.evaluate(() => window.__opened);
  console.log(JSON.stringify(opened, null, 2));
  if (opened && opened.length) {
    const url = opened[0];
    if (url.includes('wa.me')) {
      const text = url.split('text=')[1] || '';
      console.log('=== DECODED WHATSAPP TEXT ===');
      console.log(decodeURIComponent(text));
    }
  }

  console.log('=== CONSOLE ERRORS (first 15) ===');
  console.log(consoleErrors.slice(0, 15).join('\n') || '(none)');
});
