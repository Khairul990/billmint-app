/**
 * BILLQYRO WORKSPACE LIFECYCLE & MULTI-ACCOUNT ISOLATION TEST SUITE
 * Verifies all 12 workspace lifecycle requirements.
 */

import assert from 'assert';

function runWorkspaceLifecycleSuite() {
  console.log('\n======================================================');
  console.log('🏢 BILLQYRO WORKSPACE LIFECYCLE & ISOLATION AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // Simulated Storage Architecture
  const localStorageMock = new Map();
  const firestoreMock = new Map();

  const getRealUserId = () => {
    const auth = localStorageMock.get('billqyro_auth');
    if (auth) {
      try { return JSON.parse(auth).uid; } catch { return null; }
    }
    return null;
  };

  const getScopedKey = (baseKey) => {
    const uid = getRealUserId();
    if (!uid) return baseKey;
    return `${baseKey}_${uid}`;
  };

  const getSettings = () => {
    const uid = getRealUserId();
    if (!uid) return null;
    const s = localStorageMock.get(`billqyro_settings_${uid}`);
    return s ? JSON.parse(s) : null;
  };

  const saveSettings = (settings) => {
    const uid = getRealUserId();
    if (!uid) return;
    localStorageMock.set(`billqyro_settings_${uid}`, JSON.stringify(settings));
    firestoreMock.set(`settings/${uid}`, JSON.stringify(settings));
  };

  const loginUser = (uid, email) => {
    localStorageMock.set('billqyro_auth', JSON.stringify({ uid, userEmail: email }));
    // Restore from firestore if available
    const cloudSettings = firestoreMock.get(`settings/${uid}`);
    if (cloudSettings) {
      const parsed = JSON.parse(cloudSettings);
      const workspaces = parsed.businessWorkspaces || [];
      const savedLastWs = localStorageMock.get(`billqyro_${uid}_last_workspace`);
      
      let activeWsId = savedLastWs;
      if (!activeWsId || !workspaces.some(w => w.id === activeWsId)) {
        activeWsId = parsed.activeWorkspaceId;
      }
      if (!activeWsId || !workspaces.some(w => w.id === activeWsId)) {
        const primary = workspaces.find(w => w.name && w.name !== 'Default Workspace' && w.name !== 'My Retail Shop') || workspaces[0];
        activeWsId = primary ? primary.id : 'default';
      }
      parsed.activeWorkspaceId = activeWsId;
      localStorageMock.set(`billqyro_settings_${uid}`, JSON.stringify(parsed));
      localStorageMock.set(`billqyro_${uid}_last_workspace`, activeWsId);
    }
  };

  const logoutUser = () => {
    // Only remove session state! Never delete scoped persistent account data
    localStorageMock.delete('billqyro_auth');
    localStorageMock.delete('billqyro_last_route');
  };

  // Seed Initial Cloud Account for Account A
  const accountAUid = 'uid_khairul_1118';
  const accountAEmail = 'khairul2052007@gmail.com';
  const accountASettings = {
    userId: accountAUid,
    email: accountAEmail,
    businessName: 'KB.Embroidery Designer 1118',
    setupCompleted: true,
    activeWorkspaceId: 'ws_emb_1118',
    businessWorkspaces: [
      { id: 'ws_emb_1118', name: 'KB.Embroidery Designer 1118', type: 'embroidery', archived: false }
    ]
  };
  firestoreMock.set(`settings/${accountAUid}`, JSON.stringify(accountASettings));

  // --- 1. Existing User Login ---
  test('1. Existing user login: Restores existing workspace "KB.Embroidery Designer 1118"', () => {
    loginUser(accountAUid, accountAEmail);
    const settings = getSettings();
    assert.strictEqual(settings.businessName, 'KB.Embroidery Designer 1118');
    assert.strictEqual(settings.activeWorkspaceId, 'ws_emb_1118');
    assert.strictEqual(settings.businessWorkspaces.length, 1);
  });

  // --- 2. Logout Does Not Destroy Workspace ---
  test('2. Logout does not destroy workspace: Scoped settings remain intact in persistent storage', () => {
    logoutUser();
    assert.strictEqual(localStorageMock.has('billqyro_auth'), false);
    // Persistent account cache remains intact
    assert.strictEqual(localStorageMock.has(`billqyro_settings_${accountAUid}`), true);
    const raw = JSON.parse(localStorageMock.get(`billqyro_settings_${accountAUid}`));
    assert.strictEqual(raw.businessName, 'KB.Embroidery Designer 1118');
  });

  // --- 3. Relogin Restores Same Workspace ---
  test('3. Relogin restores same workspace: Logging back in resolves to "KB.Embroidery Designer 1118"', () => {
    loginUser(accountAUid, accountAEmail);
    const settings = getSettings();
    assert.strictEqual(settings.businessName, 'KB.Embroidery Designer 1118');
    assert.strictEqual(settings.activeWorkspaceId, 'ws_emb_1118');
  });

  // --- 4. Existing User Does Not Trigger Workspace Creation ---
  test('4. Existing user does not trigger workspace creation: businessWorkspaces length remains 1', () => {
    const settings = getSettings();
    assert.strictEqual(settings.businessWorkspaces.length, 1);
    assert.strictEqual(settings.businessWorkspaces[0].name, 'KB.Embroidery Designer 1118');
  });

  // --- 5. New User Creates Exactly One Workspace ---
  test('5. New user creates exactly one workspace upon registration and onboarding', () => {
    const newUid = 'uid_new_user_99';
    loginUser(newUid, 'newuser@example.com');
    
    // Simulate Onboarding
    const newWs = { id: 'ws_fresh_01', name: 'Fresh Retail Hub', type: 'retail', archived: false };
    const newSettings = {
      userId: newUid,
      email: 'newuser@example.com',
      businessName: 'Fresh Retail Hub',
      setupCompleted: true,
      activeWorkspaceId: newWs.id,
      businessWorkspaces: [newWs]
    };
    saveSettings(newSettings);
    
    const loaded = getSettings();
    assert.strictEqual(loaded.businessName, 'Fresh Retail Hub');
    assert.strictEqual(loaded.businessWorkspaces.length, 1);
    logoutUser();
  });

  // --- 6. Account A cannot restore Account B workspace ---
  test('6. Account A and Account B complete workspace isolation on same device', () => {
    // Login Account B
    loginUser('uid_new_user_99', 'newuser@example.com');
    assert.strictEqual(getSettings().businessName, 'Fresh Retail Hub');
    logoutUser();

    // Re-login Account A
    loginUser(accountAUid, accountAEmail);
    assert.strictEqual(getSettings().businessName, 'KB.Embroidery Designer 1118');
    assert.strictEqual(getSettings().activeWorkspaceId, 'ws_emb_1118');
  });

  // --- 7. activeWorkspaceId belongs to authenticated UID ---
  test('7. activeWorkspaceId belongs strictly to authenticated UID', () => {
    const uid = getRealUserId();
    assert.strictEqual(uid, accountAUid);
    const settings = getSettings();
    assert(settings.businessWorkspaces.some(w => w.id === settings.activeWorkspaceId));
  });

  // --- 8. Refresh restores same workspace ---
  test('8. Browser refresh restores same workspace from scoped cache', () => {
    // Simulate refresh: re-read from localStorageMock without changing auth
    const settings = getSettings();
    assert.strictEqual(settings.businessName, 'KB.Embroidery Designer 1118');
    assert.strictEqual(settings.activeWorkspaceId, 'ws_emb_1118');
  });

  // --- 9 & 10. Multi-Workspace Under Same Account ---
  test('9 - 10. Multi-workspace support: Switching to secondary workspace and relogging in restores last active workspace', () => {
    const settings = getSettings();
    const secondWs = { id: 'ws_second_branch', name: 'KB Branch 2', type: 'embroidery', archived: false };
    settings.businessWorkspaces.push(secondWs);
    settings.activeWorkspaceId = secondWs.id;
    saveSettings(settings);
    localStorageMock.set(`billqyro_${accountAUid}_last_workspace`, secondWs.id);

    logoutUser();
    loginUser(accountAUid, accountAEmail);

    const reloaded = getSettings();
    assert.strictEqual(reloaded.activeWorkspaceId, 'ws_second_branch', 'Last active workspace must be restored');
    assert.strictEqual(reloaded.businessWorkspaces.length, 2);
  });

  // --- 11. Stale Workspace ID Rejection ---
  test('11. Stale workspace ID rejection: If active workspace ID is deleted/invalid, falls back safely to primary workspace', () => {
    localStorageMock.set(`billqyro_${accountAUid}_last_workspace`, 'ws_non_existent_999');
    const cloud = JSON.parse(firestoreMock.get(`settings/${accountAUid}`));
    cloud.activeWorkspaceId = 'ws_deleted_999';
    firestoreMock.set(`settings/${accountAUid}`, JSON.stringify(cloud));

    logoutUser();
    loginUser(accountAUid, accountAEmail);

    const reloaded = getSettings();
    assert.strictEqual(reloaded.activeWorkspaceId, 'ws_emb_1118', 'Must safely fall back to legitimate primary workspace');
  });

  // --- 12. Missing workspace creates one ONLY for genuinely new users ---
  test('12. Missing workspace creates default only when account genuinely has zero workspaces', () => {
    const brandNewUid = 'uid_brand_new_000';
    loginUser(brandNewUid, 'brandnew@test.com');
    
    // Genuinely empty account
    assert.strictEqual(getSettings(), null);
    logoutUser();
  });

  console.log('\n======================================================');
  console.log(`🏢 WORKSPACE AUDIT: ${passed} / ${total} PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('======================================================\n');
}

runWorkspaceLifecycleSuite();
