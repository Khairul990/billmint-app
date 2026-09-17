/**
 * Voice-to-Bill parser regression suite.
 * Run: node --test tests/voiceBillParser.test.mjs
 *
 * Locks the speech → bill conventions documented in src/utils/voiceBillParser.js:
 *   - Bengali digits & number words (দুইশো পঞ্চাশ, পাঁচ হাজার তিনশো বিশ…)
 *   - customer extraction ("রহিমের বিল" / "customer Rahim")
 *   - "item qty unit amount" → amount is the LINE TOTAL (price = amount / qty)
 *   - amount-first form ("দুইশো টাকার চাল")
 */
import assert from 'node:assert';
import {
  parseVoiceBill,
  wordsToNumber,
  normalizeSpeechText,
} from '../src/utils/voiceBillParser.js';

console.log('\n======================================================');
console.log('🎙️ RUNNING VOICE-TO-BILL PARSER REGRESSION');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;
function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

it('1.1: Bengali digits are normalized (২০০ → 200)', () => {
  assert.strictEqual(normalizeSpeechText('চাল ২০০ টাকা').includes('200'), true);
});

it('1.2: wordsToNumber — Bengali compound & scale words', () => {
  assert.strictEqual(wordsToNumber(['দুই', 'শত', 'পঞ্চাশ']), 250);
  assert.strictEqual(wordsToNumber(['দুইশো', 'পঞ্চাশ']), 250);
  assert.strictEqual(wordsToNumber(['পাঁচ', 'হাজার', 'তিনশো', 'বিশ']), 5320);
  assert.strictEqual(wordsToNumber(['এক', 'লাখ']), 100000);
});

it('1.3: wordsToNumber — English words', () => {
  assert.strictEqual(wordsToNumber(['two', 'hundred', 'fifty']), 250);
  assert.strictEqual(wordsToNumber(['one', 'thousand', 'five', 'hundred']), 1500);
});

it('1.4: wordsToNumber — mixed digits & words', () => {
  assert.strictEqual(wordsToNumber(['2', 'হাজার', '500']), 2500);
});

it('2.1: Bengali full bill — customer + qty/total rule', () => {
  const r = parseVoiceBill('রহিমের বিল, চাল ৫ কেজি ২০০ টাকা, ডাল ২ কেজি ৩০০ টাকা');
  assert.strictEqual(r.customerName, 'রহিম');
  assert.strictEqual(r.items.length, 2);
  assert.deepStrictEqual(r.items[0], { name: 'চাল', qty: 5, price: 40 });
  assert.deepStrictEqual(r.items[1], { name: 'ডাল', qty: 2, price: 150 });
});

it('2.2: Bengali number words without qty', () => {
  const r = parseVoiceBill('চা দুইশো টাকা আর চিনি একশো পঞ্চাশ টাকা');
  assert.strictEqual(r.customerName, '');
  assert.strictEqual(r.items.length, 2);
  assert.deepStrictEqual(r.items[0], { name: 'চা', qty: 1, price: 200 });
  assert.deepStrictEqual(r.items[1], { name: 'চিনি', qty: 1, price: 150 });
});

it('2.3: amount-first Bengali ("দুইশো টাকার চাল")', () => {
  const r = parseVoiceBill('দুইশো টাকার চাল');
  assert.strictEqual(r.items.length, 1);
  assert.deepStrictEqual(r.items[0], { name: 'চাল', qty: 1, price: 200 });
});

it('2.4: English bill — customer + qty/total rule', () => {
  const r = parseVoiceBill('customer Rahim, rice 5 kg 200 rupees, sugar 150 rupees');
  assert.strictEqual(r.customerName, 'Rahim');
  assert.strictEqual(r.items.length, 2);
  assert.deepStrictEqual(r.items[0], { name: 'rice', qty: 5, price: 40 });
  assert.deepStrictEqual(r.items[1], { name: 'sugar', qty: 1, price: 150 });
});

it('2.5: speech with no numbers yields no items (no crash)', () => {
  const r = parseVoiceBill('আজ আবহাওয়া খুব ভালো দাদা');
  assert.strictEqual(r.items.length, 0);
  assert.strictEqual(r.customerName, '');
});

it('2.6: ৳ symbol and Bengali digits without spaces', () => {
  const r = parseVoiceBill('ময়না ৳২৫০');
  assert.strictEqual(r.items.length, 1);
  assert.deepStrictEqual(r.items[0], { name: 'ময়না', qty: 1, price: 250 });
});

it('2.7: big Bengali number words ("পাঁচ হাজার তিনশো বিশ টাকার চাল")', () => {
  const r = parseVoiceBill('পাঁচ হাজার তিনশো বিশ টাকার চাল');
  assert.strictEqual(r.items.length, 1);
  assert.deepStrictEqual(r.items[0], { name: 'চাল', qty: 1, price: 5320 });
});

console.log(`\n  ${passedTests} passed, ${failedTests} failed\n`);
if (failedTests > 0) process.exit(1);
