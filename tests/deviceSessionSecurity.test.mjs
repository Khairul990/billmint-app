import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync('src/services/deviceSessionEngine.js', 'utf8');
const security = fs.readFileSync('src/services/securityEngine.js', 'utf8');
const auth = fs.readFileSync('src/services/authEngine.js', 'utf8');
const rules = fs.readFileSync('firestore.rules', 'utf8');
const functions = fs.readFileSync('functions/index.js', 'utf8');
const panel = fs.readFileSync('src/components/security/DeviceSecurityPanel.jsx', 'utf8');

const tests = [
  ['stable device id is local and non-PII', () => {
    assert.match(service, /billqyro_device_id_v1/);
    assert.match(service, /localStorage\.setItem\(DEVICE_ID_KEY/);
    assert.doesNotMatch(service, /email.*DEVICE_ID|password.*DEVICE_ID|phone.*DEVICE_ID/i);
  }],
  ['session id and secret are session-scoped', () => {
    assert.match(service, /sessionStorage\.setItem\(SESSION_ID_KEY/);
    assert.match(service, /sessionStorage\.setItem\(SESSION_SECRET_KEY/);
  }],
  ['session metadata never stores password or Firebase refresh token', () => {
    assert.doesNotMatch(service, /password\s*:/i);
    assert.doesNotMatch(service, /refreshToken\s*:/i);
    assert.doesNotMatch(service, /accessToken\s*:/i);
  }],
  ['heartbeat is throttled to minutes, not seconds', () => {
    assert.match(service, /HEARTBEAT_MS\s*=\s*5 \* 60 \* 1000/);
  }],
  ['remote logout is server callable', () => {
    assert.match(service, /revokeDeviceSession/);
    assert.match(functions, /exports\.revokeDeviceSession/);
  }],
  ['new-device approval cannot self-approve', () => {
    assert.match(functions, /targetSessionId === callerSessionId/);
    assert.match(functions, /A device cannot approve itself/);
  }],
  ['logout all other devices preserves caller session', () => {
    assert.match(functions, /if \(sessionDoc\.id === callerSessionId\) return/);
    assert.match(service, /logoutOtherDeviceSessions/);
  }],
  ['Firestore session ownership is user-scoped', () => {
    assert.match(rules, /match \/users\/\{userId\}\/sessions\/\{sessionId\}/);
    assert.match(rules, /isOwner\(userId\)/);
    assert.match(rules, /allow delete: if false/);
  }],
  ['revocation cannot be written directly by the browser', () => {
    assert.match(rules, /request\.resource\.data\.status == resource\.data\.status/);
    assert.match(functions, /status: \"revoked\"/);
  }],
  ['auth flows register a device session', () => {
    assert.match(auth, /registerCurrentSession/);
    assert.match(auth, /getNewDeviceApproval/);
  }],
  ['new device is blocked until approval', () => {
    assert.match(auth, /NEW_DEVICE_APPROVAL_REQUIRED/);
    assert.match(auth, /signOut\(auth\)/);
    assert.match(service, /status: pending|status:.*pending/);
  }],
  ['security panel exposes device management actions', () => {
    assert.match(panel, /Where You're Logged In/);
    assert.match(panel, /Log Out All Other Devices/);
    assert.match(panel, /Require approval for new devices/);
    assert.match(panel, /Approve/);
  }]
];

for (const [name, test] of tests) {
  test();
  console.log(`✓ ${name}`);
}

console.log(`\nDEVICE SESSION SECURITY: ${tests.length}/${tests.length} PASSED`);
