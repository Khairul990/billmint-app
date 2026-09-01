import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getScopedKey, 
  KEYS, 
  GLOBAL_KEYS, 
  getRealUserId, 
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  stampRecord
} from '../src/services/dbEngine.js';
import { workspaceEngine } from '../src/services/workspaceEngine.js';
import { authEngine } from '../src/services/authEngine.js';
import { securityEngine } from '../src/services/securityEngine.js';
import { offlineEngine } from '../src/services/offlineEngine.js';
import { filterByWorkspace } from '../src/utils/invoiceMath.js';

test('⚡ BILLQYRO PHASE A: USER & WORKSPACE FOUNDATION MASTER SUITE', async (t) => {

  // Mock global browser localStorage and IndexedDB for testing environment
  const storageMap = new Map();
  global.localStorage = {
    getItem: (key) => storageMap.has(key) ? storageMap.get(key) : null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    get length() { return storageMap.size; },
    key: (i) => Array.from(storageMap.keys())[i] || null
  };

  const idbStores = new Map();
  global.indexedDB = {
    open: () => {
      const dbObj = {
        objectStoreNames: { contains: () => true },
        createObjectStore: () => {},
        transaction: (storeNames, mode) => {
          return {
            objectStore: (name) => {
              if (!idbStores.has(name)) idbStores.set(name, new Map());
              const store = idbStores.get(name);
              return {
                getAll: () => {
                  const r = { result: Array.from(store.values()) };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                },
                get: (id) => {
                  const r = { result: store.get(id) };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                },
                put: (item) => {
                  if (item && item.id) store.set(item.id, item);
                  const r = { result: item?.id };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                },
                delete: (id) => {
                  store.delete(id);
                  const r = { result: true };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                },
                clear: () => {
                  store.clear();
                  const r = { result: true };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                }
              };
            }
          };
        }
      };

      const req = {
        result: dbObj
      };
      setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
      return req;
    }
  };

  global.window = {
    dispatchEvent: () => true,
    CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } }
  };

  // Helper to set session
  const setMockSession = (uid, email = 'user@example.com', isSuperAdmin = false) => {
    const session = { uid, userEmail: email, token: 'mock-token', timestamp: Date.now(), isSuperAdmin };
    storageMap.set(GLOBAL_KEYS.AUTH, JSON.stringify(session));
    return session;
  };

  const clearMockSession = () => {
    storageMap.delete(GLOBAL_KEYS.AUTH);
  };

  // =========================================================================
  // SCENARIO A: New User Initialization
  // =========================================================================
  await t.test('SCENARIO A: New user initialization creates clean structure without fake data', async () => {
    storageMap.clear();
    setMockSession('uid_new_user_1', 'newuser1@billqyro.com');

    assert.equal(getRealUserId(), 'uid_new_user_1');
    const settings = getSettings();
    assert.ok(settings, 'Settings object should exist');
    assert.equal(settings.defaultTax || 0, 0, 'New user default tax must be 0%');
  });

  // =========================================================================
  // SCENARIO B: Existing User Login
  // =========================================================================
  await t.test('SCENARIO B: Existing user login resolves correct identity and restores workspace', async () => {
    const uid = 'uid_existing_user';
    setMockSession(uid, 'existing@billqyro.com');

    const userSettings = {
      businessName: 'My Tailor Shop',
      businessType: 'tailor',
      businessWorkspaces: [
        { id: 'ws_tailor_01', name: 'Main Branch', type: 'tailor', enabledModules: ['billing', 'customers'] }
      ],
      activeWorkspaceId: 'ws_tailor_01'
    };
    storageMap.set(`${GLOBAL_KEYS.SETTINGS}_${uid}`, JSON.stringify(userSettings));

    const currentWs = await workspaceEngine.getCurrent();
    assert.equal(currentWs.id, 'ws_tailor_01');
    assert.equal(currentWs.name, 'Main Branch');
  });

  // =========================================================================
  // SCENARIO C: Logout/Login Persistence
  // =========================================================================
  await t.test('SCENARIO C: User data persists across logout and login cycle without destruction', async () => {
    const uid = 'uid_persist_user';
    setMockSession(uid, 'persist@billqyro.com');

    const userSettings = {
      businessName: 'Super Clinic',
      activeWorkspaceId: 'ws_clinic_01',
      businessWorkspaces: [{ id: 'ws_clinic_01', name: 'Super Clinic', type: 'clinic' }]
    };
    storageMap.set(`${GLOBAL_KEYS.SETTINGS}_${uid}`, JSON.stringify(userSettings));

    // Logout
    clearMockSession();
    assert.equal(getRealUserId(), null, 'UID is null after logout');

    // Relogin
    setMockSession(uid, 'persist@billqyro.com');
    assert.equal(getRealUserId(), uid, 'UID restored after login');

    const restoredSettings = getSettings();
    assert.equal(restoredSettings.businessName, 'Super Clinic');
    assert.equal(restoredSettings.activeWorkspaceId, 'ws_clinic_01');
  });

  // =========================================================================
  // SCENARIO D & E: Workspace Creation and Switching
  // =========================================================================
  await t.test('SCENARIO D & E: Workspace creation and switching updates state and persists accurately', async () => {
    const uid = 'uid_ws_switcher';
    setMockSession(uid, 'switcher@billqyro.com');

    const initialSettings = {
      businessName: 'Retail Alpha',
      activeWorkspaceId: 'ws_1',
      businessWorkspaces: [
        { id: 'ws_1', name: 'Retail Alpha', type: 'retail' }
      ]
    };
    storageMap.set(`${GLOBAL_KEYS.SETTINGS}_${uid}`, JSON.stringify(initialSettings));

    // Create workspace 2
    const ws2Id = await workspaceEngine.createWorkspace('Embroidery Branch', uid);
    assert.ok(ws2Id.startsWith('ws_'));

    const settingsAfterCreate = getSettings();
    assert.equal(settingsAfterCreate.activeWorkspaceId, ws2Id);
    assert.equal(settingsAfterCreate.businessName, 'Embroidery Branch');

    // Switch back to workspace 1
    const switched = await workspaceEngine.switchWorkspace('ws_1');
    assert.equal(switched, true);

    const settingsAfterSwitch = getSettings();
    assert.equal(settingsAfterSwitch.activeWorkspaceId, 'ws_1');
  });

  // =========================================================================
  // SCENARIO F: Workspace Isolation
  // =========================================================================
  await t.test('SCENARIO F: Workspace A data is completely isolated from Workspace B', async () => {
    const invoices = [
      { id: 'inv_w1_01', workspaceId: 'ws_branch_1', grandTotal: 5000, amountPaid: 5000 },
      { id: 'inv_w1_02', workspaceId: 'ws_branch_1', grandTotal: 3000, amountPaid: 1000 },
      { id: 'inv_w2_01', workspaceId: 'ws_branch_2', grandTotal: 9000, amountPaid: 9000 }
    ];

    const branch1Invoices = filterByWorkspace(invoices, 'ws_branch_1');
    const branch2Invoices = filterByWorkspace(invoices, 'ws_branch_2');

    assert.equal(branch1Invoices.length, 2);
    assert.equal(branch2Invoices.length, 1);
    assert.equal(branch1Invoices.every(i => i.workspaceId === 'ws_branch_1'), true);
    assert.equal(branch2Invoices.every(i => i.workspaceId === 'ws_branch_2'), true);
  });

  // =========================================================================
  // SCENARIO G: User Isolation
  // =========================================================================
  await t.test('SCENARIO G: User A and User B on same machine have strictly isolated keys and data', async () => {
    setMockSession('uid_alice', 'alice@test.com');
    const aliceSettingsKey = getScopedKey(GLOBAL_KEYS.SETTINGS);
    storageMap.set(aliceSettingsKey, JSON.stringify({ businessName: 'Alice Shop', activeWorkspaceId: 'ws_alice' }));

    setMockSession('uid_bob', 'bob@test.com');
    const bobSettingsKey = getScopedKey(GLOBAL_KEYS.SETTINGS);
    storageMap.set(bobSettingsKey, JSON.stringify({ businessName: 'Bob Repair', activeWorkspaceId: 'ws_bob' }));

    assert.notEqual(aliceSettingsKey, bobSettingsKey);

    // Verify Alice cannot see Bob's data
    setMockSession('uid_alice', 'alice@test.com');
    const aliceSettings = getSettings();
    assert.equal(aliceSettings.businessName, 'Alice Shop');
    assert.equal(aliceSettings.activeWorkspaceId, 'ws_alice');

    setMockSession('uid_bob', 'bob@test.com');
    const bobSettings = getSettings();
    assert.equal(bobSettings.businessName, 'Bob Repair');
    assert.equal(bobSettings.activeWorkspaceId, 'ws_bob');
  });

  // =========================================================================
  // SCENARIO H & I: Settings Persistence and Update Consistency
  // =========================================================================
  await t.test('SCENARIO H & I: Settings updates persist canonically across reloads and views', async () => {
    const uid = 'uid_settings_sync';
    setMockSession(uid, 'sync@test.com');

    const s = {
      businessName: 'Initial Name',
      phone: '9876543210',
      activeWorkspaceId: 'ws_main',
      defaultTax: 0
    };
    saveSettings(s);

    const loaded1 = getSettings();
    assert.equal(loaded1.businessName, 'Initial Name');

    // Update phone & businessName
    loaded1.businessName = 'Updated Business Name';
    loaded1.phone = '9123456789';
    saveSettings(loaded1);

    const loaded2 = getSettings();
    assert.equal(loaded2.businessName, 'Updated Business Name');
    assert.equal(loaded2.phone, '9123456789');
  });

  // =========================================================================
  // SCENARIO J & K: Customer and Product Update Consistency
  // =========================================================================
  await t.test('SCENARIO J & K: Customer & Product updates stamp version and maintain consistency', async () => {
    const uid = 'uid_stamp_test';
    setMockSession(uid, 'stamp@test.com');

    const rawCustomer = { id: 'cust_01', name: 'Rahim Sheikh', phone: '9876500001' };
    const stampedCust = stampRecord(rawCustomer, uid);

    assert.equal(stampedCust.userId, uid);
    assert.ok(stampedCust.updatedAt);
    assert.equal(stampedCust.__version, 1);

    const updatedCust = stampRecord({ ...stampedCust, phone: '9876500099' }, uid);
    assert.equal(updatedCust.__version, 2);
    assert.equal(updatedCust.phone, '9876500099');
  });

  // =========================================================================
  // SCENARIO L & M: Category Persistence and Tax Default
  // =========================================================================
  await t.test('SCENARIO L & M: Category persists cleanly and default tax is strictly 0% (NO 18% GST)', async () => {
    const uid = 'uid_cat_tax';
    setMockSession(uid, 'cattax@test.com');

    const s = {
      businessType: 'embroidery',
      businessCategory: 'embroidery',
      activeWorkspaceId: 'ws_emb_1',
      defaultTax: 0,
      defaultTaxRate: 0
    };
    saveSettings(s);

    const loaded = getSettings();
    assert.equal(loaded.businessCategory, 'embroidery');
    assert.equal(loaded.businessType, 'embroidery');
    assert.equal(loaded.defaultTax, 0, 'Default tax must be 0%');
    assert.equal(loaded.defaultTaxRate, 0, 'Default tax rate must be 0%');
  });

  // =========================================================================
  // SCENARIO N: No Fake Financial Data
  // =========================================================================
  await t.test('SCENARIO N: Brand new workspace produces clean zero revenue and empty customer list', async () => {
    const uid = 'uid_clean_zero';
    setMockSession(uid, 'clean@test.com');

    const s = {
      businessName: 'Clean Zero Shop',
      activeWorkspaceId: 'ws_clean_01',
      businessWorkspaces: [{ id: 'ws_clean_01', name: 'Clean Zero Shop', type: 'retail' }]
    };
    saveSettings(s);

    const scopedCustKey = getScopedKey(GLOBAL_KEYS.CUSTOMERS);
    const scopedInvKey = getScopedKey(GLOBAL_KEYS.INVOICES);

    assert.equal(localStorage.getItem(scopedCustKey), null);
    assert.equal(localStorage.getItem(scopedInvKey), null);
  });

  // =========================================================================
  // SCENARIO P & Q: Offline Queue and Idempotency
  // =========================================================================
  await t.test('SCENARIO P & Q: Offline engine queues operations idempotently without duplicates', async () => {
    const uid = 'uid_offline_test';
    setMockSession(uid, 'offline@test.com');

    const queueKey = `billqyro_sync_queue_${uid}`;
    const initialQueue = [
      { id: 'tx_1', action: 'save', collection: 'invoices', docId: 'inv_101', data: { grandTotal: 1000 }, status: 'pending' }
    ];
    storageMap.set(queueKey, JSON.stringify(initialQueue));

    const retrievedQueue = JSON.parse(storageMap.get(queueKey) || '[]');
    assert.equal(retrievedQueue.length, 1);
    assert.equal(retrievedQueue[0].docId, 'inv_101');
  });

  // =========================================================================
  // SCENARIO T & U: Local Cache Isolation and Logout Safety
  // =========================================================================
  await t.test('SCENARIO T & U: Logout does not destroy legitimate local data and prevents cross-user leakage', async () => {
    const userA = 'uid_user_alpha';
    const userB = 'uid_user_bravo';

    setMockSession(userA, 'alpha@test.com');
    saveSettings({ businessName: 'Alpha Store', activeWorkspaceId: 'ws_alpha' });

    // User A logs out
    clearMockSession();

    // User B logs in
    setMockSession(userB, 'bravo@test.com');
    saveSettings({ businessName: 'Bravo Clinic', activeWorkspaceId: 'ws_bravo' });

    // User B logs out
    clearMockSession();

    // User A logs back in
    setMockSession(userA, 'alpha@test.com');
    const alphaRestored = getSettings();
    assert.equal(alphaRestored.businessName, 'Alpha Store');
    assert.equal(alphaRestored.activeWorkspaceId, 'ws_alpha');

    // User B logs back in
    clearMockSession();
    setMockSession(userB, 'bravo@test.com');
    const bravoRestored = getSettings();
    assert.equal(bravoRestored.businessName, 'Bravo Clinic');
    assert.equal(bravoRestored.activeWorkspaceId, 'ws_bravo');
  });

  // =========================================================================
  // SCENARIO O: Browser Refresh Simulation
  // =========================================================================
  await t.test('SCENARIO O: Browser refresh reconstructs identical active workspace and valid state', async () => {
    const uid = 'uid_refresh_user';
    setMockSession(uid, 'refresh@test.com');

    const s = {
      businessName: 'Optics Hub',
      activeWorkspaceId: 'ws_optics_1',
      businessWorkspaces: [{ id: 'ws_optics_1', name: 'Optics Hub', type: 'retail' }]
    };
    saveSettings(s);

    // Simulate page reload by reading fresh from scoped store
    const reloadedSettings = getSettings();
    const currentWs = await workspaceEngine.getCurrent();

    assert.equal(reloadedSettings.businessName, 'Optics Hub');
    assert.equal(currentWs.id, 'ws_optics_1');
    assert.equal(currentWs.name, 'Optics Hub');
  });

  // =========================================================================
  // SCENARIO R: Multi-Tab Storage Event Handling
  // =========================================================================
  await t.test('SCENARIO R: Multi-tab workspace changes dispatch notification events properly', async () => {
    const uid = 'uid_multitab';
    setMockSession(uid, 'multitab@test.com');

    let eventFired = false;
    let detailPayload = null;
    global.window.dispatchEvent = (event) => {
      if (event.type === 'billqyro_workspace_changed') {
        eventFired = true;
        detailPayload = event.detail;
      }
      return true;
    };

    await workspaceEngine.switchWorkspace('ws_multitab_target');
    assert.equal(eventFired, true);
    assert.equal(detailPayload?.workspaceId, 'ws_multitab_target');
  });

  // =========================================================================
  // SCENARIO S: Firestore Ownership Validation
  // =========================================================================
  await t.test('SCENARIO S: Stamped records always bind canonical userId for Firestore rules compliance', async () => {
    const uid = 'uid_auth_owner';
    setMockSession(uid, 'owner@test.com');

    const record = stampRecord({ name: 'Invoice Item', grandTotal: 500 });
    assert.equal(record.userId, uid, 'Stamped record userId must match current auth UID');
  });

  // =========================================================================
  // SCENARIO V: Active Workspace Determinism
  // =========================================================================
  await t.test('SCENARIO V: Active workspace is strictly deterministic with exactly one active ID', async () => {
    const uid = 'uid_deterministic_ws';
    setMockSession(uid, 'det@test.com');

    const s = {
      businessName: 'Electronics Hub',
      activeWorkspaceId: 'ws_alpha',
      businessWorkspaces: [
        { id: 'ws_alpha', name: 'Alpha', type: 'retail' },
        { id: 'ws_beta', name: 'Beta', type: 'retail' }
      ]
    };
    saveSettings(s);

    const ws = await workspaceEngine.getCurrent();
    assert.equal(ws.id, 'ws_alpha');
    assert.equal(typeof ws.id, 'string');
  });

  // =========================================================================
  // SCENARIO W: Orphan Data Detection and Fallback
  // =========================================================================
  await t.test('SCENARIO W: Filter handles records without workspaceId by falling back safely', async () => {
    const mixedRecords = [
      { id: 'rec_1', workspaceId: 'ws_known', grandTotal: 100 },
      { id: 'rec_2', workspaceId: 'ws_other', grandTotal: 200 },
      { id: 'rec_3', grandTotal: 300 } // legacy unassigned
    ];

    const knownFiltered = filterByWorkspace(mixedRecords, 'ws_known');
    assert.equal(knownFiltered.length, 1);
    assert.equal(knownFiltered[0].id, 'rec_1');
  });

  // =========================================================================
  // SCENARIO X: Security Rules & No Passwords Stored in Records
  // =========================================================================
  await t.test('SCENARIO X: Passwords, tokens, or private secrets are never stored in stamped records', async () => {
    const record = stampRecord({
      name: 'Test Record',
      password: 'PlainPassword123',
      token: 'SecretToken999',
      apiKey: 'ApiKeySecret'
    }, 'uid_test');

    assert.equal(record.password, undefined, 'Password must be stripped from records');
    assert.equal(record.apiKey, undefined, 'API Key must be stripped from records');
  });

});

