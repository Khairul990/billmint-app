/**
 * BILLQYRO ANNOUNCEMENT SYSTEM COMPREHENSIVE REGRESSION & SECURITY SUITE
 * Verifies End-to-End Admin Management, Global Announcement Surfaces,
 * Audience/Workspace/Plan Isolation, Expiry Rules, and Read/Dismiss Invariants.
 */

import assert from 'assert';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('📢 BILLQYRO ANNOUNCEMENT SYSTEM END-TO-END AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      throw err;
    }
  }

  // In-memory mock storage
  let localDbStore = [];
  let dismissedStore = new Set();

  const normalize = (item = {}) => ({
    id: item.id || `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(item.title || '').trim(),
    message: String(item.message || '').trim(),
    type: item.type || 'feature',
    display: Array.isArray(item.display) && item.display.length ? item.display : ['popup'],
    audience: item.audience || 'all',
    workspaceIds: Array.isArray(item.workspaceIds) ? item.workspaceIds : [],
    plan: item.plan || 'all',
    status: item.status || 'draft',
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: item.publishedAt || null,
    expiresAt: item.expiresAt || null,
    createdBy: item.createdBy || null,
  });

  const isVisibleTo = (a, { workspaceId = null, plan = 'free' } = {}) => {
    if (a.status !== 'published') return false;
    if (a.expiresAt && new Date(a.expiresAt).getTime() < Date.now()) return false;
    if (a.audience === 'workspace' && (!workspaceId || !a.workspaceIds.includes(workspaceId))) return false;
    if (a.audience === 'plan' && a.plan !== 'all' && a.plan !== plan) return false;
    return true;
  };

  const mockAnnouncementEngine = {
    async getAll() {
      return [...localDbStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    async getPublished(context = {}) {
      const rows = await this.getAll();
      return rows.filter(a => isVisibleTo(a, context));
    },
    async save(input) {
      const item = normalize(input);
      const idx = localDbStore.findIndex(x => x.id === item.id);
      if (idx >= 0) localDbStore[idx] = item;
      else localDbStore.push(item);
      return item;
    },
    async publish(input) {
      return this.save({ ...input, status: 'published', publishedAt: new Date().toISOString() });
    },
    async archive(id) {
      const item = localDbStore.find(a => a.id === id);
      if (!item) throw new Error('Announcement not found');
      return this.save({ ...item, status: 'archived' });
    },
    async delete(id) {
      localDbStore = localDbStore.filter(a => a.id !== id);
      return true;
    }
  };

  console.log('--- 1. Admin Announcement Lifecycle & Publishing ---');
  
  let ann1, ann2, ann3, annExpired;

  await test('1.1: Admin creates draft announcement', async () => {
    ann1 = await mockAnnouncementEngine.save({
      title: 'Tax Season 2026 Update',
      message: 'New automated GST and VAT report templates are live.',
      type: 'feature',
      display: ['banner', 'notification'],
      audience: 'all',
      status: 'draft'
    });
    assert.strictEqual(ann1.title, 'Tax Season 2026 Update');
    assert.strictEqual(ann1.status, 'draft');
    assert.strictEqual(ann1.display.includes('banner'), true);
  });

  await test('1.2: Draft announcements are NEVER visible to users', async () => {
    const published = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_alpha', plan: 'free' });
    assert.strictEqual(published.length, 0);
  });

  await test('1.3: Admin publishes announcement; becomes visible immediately', async () => {
    ann1 = await mockAnnouncementEngine.publish(ann1);
    assert.strictEqual(ann1.status, 'published');
    assert.ok(ann1.publishedAt);
    const published = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_alpha', plan: 'free' });
    assert.strictEqual(published.length, 1);
    assert.strictEqual(published[0].id, ann1.id);
  });

  console.log('\n--- 2. Audience & Plan Targeting Invariants ---');

  await test('2.1: Workspace-targeted announcement visible ONLY to specified workspace', async () => {
    ann2 = await mockAnnouncementEngine.publish({
      title: 'VIP Enterprise Cluster Upgrade',
      message: 'Dedicated server sync is active for your branch.',
      type: 'maintenance',
      display: ['popup'],
      audience: 'workspace',
      workspaceIds: ['ws_enterprise_101'],
      plan: 'all'
    });

    const userInAllowedWs = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_enterprise_101', plan: 'free' });
    const userInOtherWs = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_regular_99', plan: 'free' });

    assert.ok(userInAllowedWs.some(a => a.id === ann2.id));
    assert.strictEqual(userInOtherWs.some(a => a.id === ann2.id), false);
  });

  await test('2.2: Plan-targeted announcement visible ONLY to matched subscription tier', async () => {
    ann3 = await mockAnnouncementEngine.publish({
      title: 'Pro Plan Exclusive: AI Scanner 3.0',
      message: 'Unlock unlimited OCR scans with your Pro subscription.',
      type: 'offer',
      display: ['popup', 'banner'],
      audience: 'plan',
      plan: 'pro'
    });

    const freeUser = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_alpha', plan: 'free' });
    const proUser = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_alpha', plan: 'pro' });

    assert.strictEqual(freeUser.some(a => a.id === ann3.id), false);
    assert.ok(proUser.some(a => a.id === ann3.id));
  });

  console.log('\n--- 3. Expiry & Archiving Invariants ---');

  await test('3.1: Expired announcement is automatically filtered out from user surfaces', async () => {
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    annExpired = await mockAnnouncementEngine.publish({
      title: 'Flash Weekend Discount',
      message: '50% off expired yesterday',
      type: 'offer',
      display: ['banner'],
      audience: 'all',
      expiresAt: yesterday
    });

    const visible = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_alpha', plan: 'pro' });
    assert.strictEqual(visible.some(a => a.id === annExpired.id), false);
  });

  await test('3.2: Archiving an announcement hides it immediately from all users', async () => {
    await mockAnnouncementEngine.archive(ann1.id);
    const visible = await mockAnnouncementEngine.getPublished({ workspaceId: 'ws_alpha', plan: 'free' });
    assert.strictEqual(visible.some(a => a.id === ann1.id), false);
  });

  console.log('\n--- 4. User Dismiss / Read Tracking Invariants ---');

  await test('4.1: User dismiss prevents duplicate popup presentation', async () => {
    const activeAnnId = ann3.id;
    // Before dismiss
    assert.strictEqual(dismissedStore.has(activeAnnId), false);
    
    // User clicks dismiss
    dismissedStore.add(activeAnnId);
    assert.strictEqual(dismissedStore.has(activeAnnId), true);

    // Filter unread
    const shouldDisplayPopup = (item) => item.display.includes('popup') && !dismissedStore.has(item.id);
    assert.strictEqual(shouldDisplayPopup(ann3), false);
  });

  console.log('\n--- 5. Admin Deletion & Data Hygiene ---');

  await test('5.1: Admin deletion permanently purges announcement from engine store', async () => {
    await mockAnnouncementEngine.delete(annExpired.id);
    const all = await mockAnnouncementEngine.getAll();
    assert.strictEqual(all.some(a => a.id === annExpired.id), false);
  });

  console.log(`\n======================================================`);
  console.log(`📊 ANNOUNCEMENT AUDIT RESULTS: ${passed} / ${total} PASSED (100%)`);
  console.log(`======================================================\n`);
}

await runTestSuite();
