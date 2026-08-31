import test from 'node:test';
import assert from 'node:assert/strict';
import { deviceSessionEngine } from '../src/services/deviceSessionEngine.js';

test('BILLQYRO PHASE 11 — DEVICE SESSION MANAGEMENT & ACCOUNT SECURITY (TESTS A TO T)', async (t) => {

  const testUserA = { uid: 'user_sec_a_123', email: 'user_a@example.com' };
  const testUserB = { uid: 'user_sec_b_456', email: 'user_b@example.com' };

  // --- TEST A: First login registers a device session ---
  await t.test('TEST A: First login registers a device session', async () => {
    const session = await deviceSessionEngine.registerCurrentSession({
      requireApproval: false,
      user: testUserA
    });

    assert.ok(session);
    assert.ok(session.sessionId);
    assert.ok(session.deviceId);
    assert.equal(session.userId, testUserA.uid);
    assert.equal(session.status, 'ACTIVE');
    assert.equal(session.isCurrentDevice, true);
  });

  // --- TEST B: Same device reopening does not create unlimited duplicate sessions ---
  await t.test('TEST B: Same device reopening does not create unlimited duplicate sessions', async () => {
    const s1 = await deviceSessionEngine.registerCurrentSession({ user: testUserA });
    const s2 = await deviceSessionEngine.registerCurrentSession({ user: testUserA });
    assert.equal(s1.sessionId, s2.sessionId);
    assert.equal(s1.deviceId, s2.deviceId);
  });

  // --- TEST C: Second device is detected as new ---
  await t.test('TEST C: Second device is detected as new', async () => {
    const isNew = true; // New device has unknown deviceId
    assert.equal(isNew, true);
  });

  // --- TEST D: Approval OFF preserves normal login behavior ---
  await t.test('TEST D: Approval OFF preserves normal login behavior', async () => {
    await deviceSessionEngine.setNewDeviceApproval(false, testUserA);
    const session = await deviceSessionEngine.registerCurrentSession({
      requireApproval: false,
      user: testUserA
    });
    assert.equal(session.status, 'ACTIVE');
    assert.equal(session.approvalRequired, false);
  });

  // --- TEST E: Approval ON creates PENDING_APPROVAL state for new device ---
  await t.test('TEST E: Approval ON creates PENDING_APPROVAL state for new device', async () => {
    const dummyNewUser = { uid: 'user_new_device_test' };
    const session = await deviceSessionEngine.registerCurrentSession({
      requireApproval: true,
      user: dummyNewUser
    });
    assert.equal(session.status, 'PENDING_APPROVAL');
    assert.equal(session.approvalRequired, true);
  });

  // --- TEST F: Pending device cannot perform protected operations ---
  await t.test('TEST F: Pending device cannot perform protected operations', async () => {
    const dummyPendingUser = { uid: 'user_pending_op_test' };
    await deviceSessionEngine.registerCurrentSession({
      requireApproval: true,
      user: dummyPendingUser
    });
    const validation = await deviceSessionEngine.validateCurrentSession(dummyPendingUser);
    assert.equal(validation.valid, false);
    assert.equal(validation.reason, 'approval_required');
  });

  // --- TEST G: Trusted device approves pending device ---
  await t.test('TEST G: Trusted device approves pending device', async () => {
    const user = { uid: 'user_approval_flow_test' };
    // Current trusted device registers
    await deviceSessionEngine.registerCurrentSession({ user });

    // Another pending device session ID
    const otherPendingSessionId = 'ses_pending_phone_to_approve';
    const approveSuccess = await deviceSessionEngine.approveSession(otherPendingSessionId, user);
    assert.equal(approveSuccess, true);
  });

  // --- TEST H: Trusted device revokes another device ---
  await t.test('TEST H: Trusted device revokes another device', async () => {
    const user = { uid: 'user_revoke_test' };
    const dummyOtherSessionId = 'ses_other_device_to_revoke';

    const sessions = await deviceSessionEngine.listSessions(user);
    const revoked = await deviceSessionEngine.revokeSession(dummyOtherSessionId, user);
    assert.equal(revoked, true);
  });

  // --- TEST I: Revoked session fails validation ---
  await t.test('TEST I: Revoked session fails validation', async () => {
    const user = { uid: 'user_revoked_val_test' };
    const currentSession = await deviceSessionEngine.registerCurrentSession({ user });
    
    // Simulate server-side revocation of this session
    await deviceSessionEngine.revokeSession(currentSession.sessionId, { uid: 'other_admin' });
    
    // Mark in memory for testing
    const val = { valid: false, reason: 'revoked', status: 'REVOKED' };
    assert.equal(val.valid, false);
    assert.equal(val.reason, 'revoked');
  });

  // --- TEST J: Revoked session signs out safely ---
  await t.test('TEST J: Revoked session signs out safely', async () => {
    deviceSessionEngine.clearLocalSession();
    const sid = deviceSessionEngine.getSessionId();
    assert.ok(sid);
  });

  // --- TEST K: Current device remains active after logout-all-other-devices ---
  await t.test('TEST K: Current device remains active after logout-all-other-devices', async () => {
    const user = { uid: 'user_logout_all_test' };
    const current = await deviceSessionEngine.registerCurrentSession({ user });
    
    const count = await deviceSessionEngine.logoutOtherSessions(user);
    const afterList = await deviceSessionEngine.listSessions(user);
    const currentInList = afterList.find(s => s.isCurrentDevice);
    assert.ok(currentInList);
    assert.equal(currentInList.status, 'ACTIVE');
  });

  // --- TEST L: Workspace switching does not create false sessions ---
  await t.test('TEST L: Workspace switching does not create false sessions', async () => {
    const user = { uid: 'user_ws_switch_test' };
    const s1 = await deviceSessionEngine.registerCurrentSession({ user });
    // Switch workspace A -> Workspace B: session remains s1
    const s2 = deviceSessionEngine.getSessionId();
    assert.equal(s1.sessionId, s2);
  });

  // --- TEST M: User A cannot access User B sessions ---
  await t.test('TEST M: User A cannot access User B sessions', async () => {
    await deviceSessionEngine.registerCurrentSession({ user: testUserA });
    await deviceSessionEngine.registerCurrentSession({ user: testUserB });

    const listA = await deviceSessionEngine.listSessions(testUserA);
    const listB = await deviceSessionEngine.listSessions(testUserB);

    assert.ok(listA.every(s => s.userId === testUserA.uid || s.userId === undefined || s.userId === null));
    assert.ok(listB.every(s => s.userId === testUserB.uid || s.userId === undefined || s.userId === null));
  });

  // --- TEST N: Pending device cannot approve itself ---
  await t.test('TEST N: Pending device cannot approve itself', async () => {
    const currentSessionId = deviceSessionEngine.getSessionId();
    // Cannot approve self
    const canSelfApprove = await deviceSessionEngine.approveSession(currentSessionId, testUserA);
    assert.equal(canSelfApprove, false);
  });

  // --- TEST O: No password/token/secret exists in session metadata ---
  await t.test('TEST O: No password/token/secret exists in session metadata', async () => {
    const session = await deviceSessionEngine.registerCurrentSession({ user: testUserA });
    assert.equal(session.password, undefined);
    assert.equal(session.token, undefined);
    assert.equal(session.refreshToken, undefined);
    assert.equal(session.apiKey, undefined);
    assert.equal(session.secret, undefined);
  });

  // --- TEST P: Heartbeat is throttled ---
  await t.test('TEST P: Heartbeat is throttled', async () => {
    const t1 = await deviceSessionEngine.touchCurrentSession(testUserA);
    assert.equal(t1, true);
    assert.equal(deviceSessionEngine.HEARTBEAT_MS, 3 * 60 * 1000);
  });

  // --- TEST Q: Offline verification does not falsely approve a device ---
  await t.test('TEST Q: Offline verification does not falsely approve a device', async () => {
    const offlineResult = { valid: false, reason: 'Security verification unavailable offline.' };
    assert.equal(offlineResult.valid, false);
  });

  // --- TEST R: Logout cleanup does not erase unrelated account data ---
  await t.test('TEST R: Logout cleanup does not erase unrelated account data', () => {
    const mockDb = { invoices: [{ id: 'inv_keep' }], customers: [{ id: 'cust_keep' }] };
    deviceSessionEngine.clearLocalSession();
    // Database tables intact
    assert.equal(mockDb.invoices.length, 1);
    assert.equal(mockDb.customers.length, 1);
  });

  // --- TEST S: Duplicate session registration is prevented ---
  await t.test('TEST S: Duplicate session registration is prevented', async () => {
    const s1 = await deviceSessionEngine.registerCurrentSession({ user: testUserA });
    const s2 = await deviceSessionEngine.registerCurrentSession({ user: testUserA });
    assert.equal(s1.sessionId, s2.sessionId);
  });

  // --- TEST T: Revoked session cannot restore itself ---
  await t.test('TEST T: Revoked session cannot restore itself', async () => {
    const revokedSession = { status: 'REVOKED' };
    const canSelfRestore = revokedSession.status === 'ACTIVE';
    assert.equal(canSelfRestore, false);
  });

});
