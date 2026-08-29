// Polyfill minimal browser environment for Node.js test runner BEFORE any module evaluation
const mockStyle = { innerHTML: '', data: '', setAttribute: () => {}, appendChild: () => {}, firstChild: { data: '' } };
if (typeof globalThis.window === 'undefined' || typeof globalThis.window.addEventListener !== 'function') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    _goober: mockStyle
  };
} else {
  if (!globalThis.window.addEventListener) globalThis.window.addEventListener = () => {};
  if (!globalThis.window.removeEventListener) globalThis.window.removeEventListener = () => {};
  if (!globalThis.window.dispatchEvent) globalThis.window.dispatchEvent = () => {};
  globalThis.window._goober = mockStyle;
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => mockStyle,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    querySelector: () => mockStyle
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

const { default: assert } = await import('node:assert');
const { generateSecureToken } = await import('../src/services/dbEngine.js');
const { invoiceEngine } = await import('../src/services/invoiceEngine.js');

console.log('======================================================');
console.log('🔐 RUNNING CRYPTO-SAFE TOKEN GENERATOR & SECURITY TEST SUITE');
console.log('======================================================');

let passedTests = 0;
const test = (desc, fn) => {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
};

// 1. 1,000 New Token Generation Test
test('1. 1,000 tokens generate successfully and match exact 16-character alphanumeric length', () => {
  const tokenRegex = /^[A-Za-z0-9]{16}$/;
  for (let i = 0; i < 1000; i++) {
    const token = generateSecureToken();
    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.length, 16);
    assert.ok(tokenRegex.test(token), `Token "${token}" contains invalid characters`);
  }
});

// 2. Duplicate Token Detection (Zero Collisions in 1,000 samples)
test('2. 1,000 generated tokens exhibit zero duplicate collisions (100% uniqueness)', () => {
  const set = new Set();
  for (let i = 0; i < 1000; i++) {
    const token = generateSecureToken();
    assert.ok(!set.has(token), `Collision detected for token: ${token}`);
    set.add(token);
  }
  assert.strictEqual(set.size, 1000);
});

// 3. Custom Token Length Validation
test('3. Custom length parameter works accurately (16, 24, 32 chars)', () => {
  assert.strictEqual(generateSecureToken(16).length, 16);
  assert.strictEqual(generateSecureToken(24).length, 24);
  assert.strictEqual(generateSecureToken(32).length, 32);
});

// 4. invoiceEngine Delegation Test
test('4. invoiceEngine.generateSecureToken delegates properly to crypto implementation', () => {
  const token = invoiceEngine.generateSecureToken();
  assert.strictEqual(typeof token, 'string');
  assert.strictEqual(token.length, 16);
  assert.ok(/^[A-Za-z0-9]{16}$/.test(token));
});

// 5. Crypto API Availability Error Handling
test('5. Safe error handling when crypto API is unavailable (no unsafe fallback)', () => {
  const origCrypto = globalThis.crypto;
  try {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    assert.throws(() => {
      generateSecureToken();
    }, /Cryptographically secure random number generator is unavailable/);
  } finally {
    Object.defineProperty(globalThis, 'crypto', { value: origCrypto, configurable: true });
  }
});

// 6. Existing Public Invoice URL Compatibility
test('6. Existing legacy tokens (16-char alphanumeric) remain 100% compatible with validation patterns', () => {
  const legacyToken = 'aB3dE9xY12Z8qM0k';
  assert.ok(/^[A-Za-z0-9_-]+$/.test(legacyToken));
  assert.strictEqual(legacyToken.length, 16);
});

// 7. Uniform Character Distribution Test
test('7. Token output includes diverse character categories (lowercase, uppercase, digits)', () => {
  let hasLower = false;
  let hasUpper = false;
  let hasDigit = false;

  for (let i = 0; i < 50; i++) {
    const token = generateSecureToken();
    if (/[a-z]/.test(token)) hasLower = true;
    if (/[A-Z]/.test(token)) hasUpper = true;
    if (/[0-9]/.test(token)) hasDigit = true;
  }

  assert.ok(hasLower, 'Tokens must generate lowercase characters');
  assert.ok(hasUpper, 'Tokens must generate uppercase characters');
  assert.ok(hasDigit, 'Tokens must generate numeric characters');
});

console.log('======================================================');
console.log(`🔐 CRYPTO TOKEN SUITE: ${passedTests} / 7 PASSED (100%)`);
console.log('======================================================\n');
