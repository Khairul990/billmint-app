/**
 * Voice-to-Bill parser — converts a Bengali / English speech transcript into
 * structured bill line items (customer + items with qty & unit price).
 *
 * Pure functions only (no DOM / no React) so it stays unit-testable in Node.
 *
 * Speech conventions supported (locked by tests/voiceBillParser.test.mjs):
 *   - "রহিমের বিল, চাল ৫ কেজি ২০০ টাকা, ডাল ২ কেজি ৩০০ টাকা"
 *       → customer "রহিম", চাল qty 5 @ 40/kg (200 টাকা = line total), ডাল qty 2 @ 150
 *   - "customer Rahim, rice 5 kg 200 rupees, tea 250 rupees"
 *   - Number words: "দুইশো পঞ্চাশ", "পাঁচ হাজার তিনশো বিশ", "two hundred fifty"
 *   - Amount-first: "দুইশো টাকার চাল" → চাল @ 200
 *
 * Rule: when a quantity with a unit word (কেজি/kg/পিস/…) is followed by an
 * amount, the amount is treated as the LINE TOTAL (price = amount / qty).
 */

const BN_DIGITS = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };

const BN_NUMBER_WORDS = {
  'শূন্য': 0, 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9,
  'দশ': 10, 'এগারো': 11, 'বারো': 12, 'তেরো': 13, 'চৌদ্দ': 14, 'পনেরো': 15, 'ষোলো': 16, 'সতেরো': 17, 'আঠারো': 18,
  'ঊনিশ': 19, 'উনিশ': 19, 'বিশ': 20, 'একুশ': 21, 'বাইশ': 22, 'তেইশ': 23, 'চব্বিশ': 24, 'পঁচিশ': 25,
  'ছাব্বিশ': 26, 'সাতাশ': 27, 'আটাশ': 28, 'ঊনত্রিশ': 29, 'ত্রিশ': 30, 'একত্রিশ': 31, 'বত্রিশ': 32, 'তেত্রিশ': 33,
  'চৌত্রিশ': 34, 'পঁয়ত্রিশ': 35, 'ছত্রিশ': 36, 'সাঁইত্রিশ': 37, 'আটত্রিশ': 38, 'ঊনচল্লিশ': 39,
  'চল্লিশ': 40, 'একচল্লিশ': 41, 'দুইচল্লিশ': 42, 'তিনচল্লিশ': 43, 'চুয়াল্লিশ': 44, 'পঁয়তাল্লিশ': 45,
  'ছেচল্লিশ': 46, 'সাতচল্লিশ': 47, 'আটচল্লিশ': 48, 'ঊনপঞ্চাশ': 49, 'পঞ্চাশ': 50, 'একান্ন': 51, 'বায়ান্ন': 52,
  'তিপ্পান্ন': 53, 'চুয়ান্ন': 54, 'পঞ্চান্ন': 55, 'ছাপ্পান্ন': 56, 'সাতান্ন': 57, 'আটান্ন': 58, 'ঊনষাট': 59,
  'ষাট': 60, 'একষট্টি': 61, 'বাষট্টি': 62, 'তেষট্টি': 63, 'চৌষট্টি': 64, 'পঁয়ষট্টি': 65, 'ছেষট্টি': 66,
  'সাতষট্টি': 67, 'আটষট্টি': 68, 'ঊনসত্তর': 69, 'সত্তর': 70, 'একাত্তর': 71, 'বাহাত্তর': 72, 'তিয়াত্তর': 73,
  'চুয়াত্তর': 74, 'পঁচাত্তর': 75, 'ছিয়াত্তর': 76, 'সাতাত্তর': 77, 'আটাত্তর': 78, 'ঊনআশি': 79,
  'আশি': 80, 'একাশি': 81, 'বিরাশি': 82, 'তিরাশি': 83, 'চুরাশি': 84, 'পঁচাশি': 85, 'ছিয়াশি': 86,
  'সাতাশি': 87, 'আটাশি': 88, 'ঊননব্বই': 89, 'নব্বই': 90, 'একানব্বই': 91, 'বিরানব্বই': 92, 'তিরানব্বই': 93,
  'চুরানব্বই': 94, 'পঁচানব্বই': 95, 'ছিয়ানব্বই': 96, 'সাতানব্বই': 97, 'আটানব্বই': 98, 'নিরানব্বই': 99
};

const EN_NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90
};

const SCALE_WORDS = { 'শত': 100, 'হাজার': 1000, 'লাখ': 100000, 'hundred': 100, 'thousand': 1000, 'lakh': 100000 };

const COMPOUND_HUNDRED_PREFIX = { 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'ছয়': 6, 'সাত': 7, 'আট': 8, 'নয়': 9, 'ন': 9, 'নও': 9 };

const CURRENCY_RE = /^(টাকা|টাকার|টাকায়|রুপি|রুপির|রুপিতে|rupees|rupee|rs|taka|tk)$/i;

const UNIT_WORDS = new Set([
  'কেজি', 'কিলো', 'গ্রাম', 'লিটার', 'মন', 'পিস', 'ডজন', 'বস্তা', 'প্যাকেট', 'কার্টন', 'বাক্স', 'জোড়া', 'ইউনিট', 'শিট',
  'kg', 'kgs', 'gm', 'gram', 'grams', 'litre', 'litres', 'pcs', 'pc', 'piece', 'pieces', 'dozen',
  'bag', 'bags', 'packet', 'packets', 'carton', 'box', 'unit', 'units', 'pair', 'pairs', 'sheet', 'sheets'
]);

/** বাংলা অঙ্ক → ASCII অঙ্ক + মুদ্রা-শব্দ/সংখ্যার চারপাশে স্পেস বসায়। */
export function normalizeSpeechText(input) {
  if (!input) return '';
  let s = String(input);
  s = s.replace(/[০-৯]/g, (d) => BN_DIGITS[d]);
  s = s.replace(/[₹৳]/g, ' টাকা ');
  s = s.replace(/(টাকার|টাকায়|টাকা|রুপির|রুপিতে|রুপি)/g, ' $1 ');
  s = s.replace(/\b(rupees|rupee|taka|tk)\b/gi, ' $1 ');
  s = s.replace(/\brs\b/gi, ' rs ');
  s = s.replace(/(\d+(?:\.\d+)?)/g, ' $1 ');
  s = s.replace(/,/g, ' , ');
  return s.replace(/\s+/g, ' ').trim();
}

function compoundHundred(token) {
  const m = token.match(/^(এক|দুই|তিন|চার|পাঁচ|ছয়|সাত|আট|নয়|নও|ন)['’]?শ(?:ো)?$/);
  if (!m) return null;
  return (COMPOUND_HUNDRED_PREFIX[m[1]] || 0) * 100;
}

function tokenValue(token) {
  const tok = token.toLowerCase();
  if (/^\d+(?:\.\d+)?$/.test(tok)) return { n: parseFloat(tok) };
  if (BN_NUMBER_WORDS[tok] !== undefined) return { n: BN_NUMBER_WORDS[tok] };
  if (EN_NUMBER_WORDS[tok] !== undefined) return { n: EN_NUMBER_WORDS[tok] };
  if (SCALE_WORDS[tok] !== undefined) return { scale: SCALE_WORDS[tok] };
  const ch = compoundHundred(tok);
  if (ch !== null) return { n: ch, big: true };
  return null;
}

export function isNumishToken(token) {
  return tokenValue(token) !== null;
}

/** ["দুই","শত","পঞ্চাশ"] → 250; ["পাঁচ","হাজার","তিনশো","বিশ"] → 5320; ["two","hundred","fifty"] → 250 */
export function wordsToNumber(tokens) {
  let total = 0, cur = 0, seen = false;
  for (const raw of tokens) {
    const v = tokenValue(raw);
    if (!v) continue;
    seen = true;
    if (v.scale) {
      cur = (cur || 1) * v.scale;
      total += cur;
      cur = 0;
    } else if (v.n >= 100) {
      total += cur + v.n;
      cur = 0;
    } else {
      cur += v.n;
    }
  }
  return seen ? total + cur : null;
}

function isCurrency(tok) { return CURRENCY_RE.test(tok); }
function isUnit(tok) { return UNIT_WORDS.has(tok.toLowerCase()); }

/** ট্রান্সক্রিপ্ট থেকে গ্রাহকের নাম বের করে ও বাকি টেক্সট থেকে সেই অংশ সরিয়ে দেয়। */
function extractCustomer(text) {
  let m = text.match(/(?:customer|গ্রাহক|কাস্টমার)\s+([^\s,;]+)/i);
  if (m) return { name: m[1], rest: text.replace(m[0], ' ') };
  m = text.match(/([^\s,;]+?)(?:ের|র)\s+বিল/i);
  if (m) return { name: m[1], rest: text.replace(m[0], ' ') };
  return { name: '', rest: text };
}

function splitSegments(text) {
  return text
    .split(/\s*,\s*|\s*;\s*|\s+আর\s+|\s+এবং\s+|\s+then\s+|\s+also\s+|\s+plus\s+|\s+&\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSegment(seg) {
  const toks = seg.split(/\s+/).filter(Boolean);
  if (!toks.length) return null;

  // Group consecutive number-ish tokens into valued chunks.
  const chunks = [];
  let i = 0;
  while (i < toks.length) {
    if (isNumishToken(toks[i])) {
      const start = i;
      const parts = [];
      while (i < toks.length && isNumishToken(toks[i])) { parts.push(toks[i]); i++; }
      const value = wordsToNumber(parts);
      if (value === null || isNaN(value)) continue;
      const nextTok = toks[i] || '';
      const prevTok = start > 0 ? toks[start - 1] : '';
      chunks.push({ value, start, end: i - 1, currency: isCurrency(nextTok) || isCurrency(prevTok) });
    } else {
      i++;
    }
  }
  if (!chunks.length) return null;

  // Amount: last currency-marked chunk, else the last chunk.
  let amountChunk = [...chunks].reverse().find((c) => c.currency) || chunks[chunks.length - 1];
  const amount = amountChunk.value;
  if (!(amount > 0)) return null;

  // Qty: first chunk (≠ amount) directly followed by a unit word → amount is line total.
  let qty = 1;
  let price = amount;
  const first = chunks[0];
  if (chunks.length >= 2 && first !== amountChunk && isUnit(toks[first.end + 1] || '') && first.value > 0) {
    qty = first.value;
    price = Math.round((amount / qty) * 100) / 100;
  }

  // Name: everything except numbers, currency words, unit words and filler.
  const dropIdx = new Set();
  chunks.forEach((c) => { for (let k = c.start; k <= c.end; k++) dropIdx.add(k); });
  const name = toks
    .filter((tok, idx) => !dropIdx.has(idx) && !isCurrency(tok) && !isUnit(tok) && tok !== 'এর' && tok !== 'এবং' && tok !== 'আর')
    .join(' ')
    .replace(/[.,;:]+$/g, '')
    .trim();
  if (!name) return null;

  return { name, qty, price };
}

/**
 * Main entry — parse a voice transcript into a bill draft.
 * @param {string} transcript raw speech text (Bengali or English)
 * @returns {{ customerName: string, items: Array<{name: string, qty: number, price: number}> }}
 */
export function parseVoiceBill(transcript) {
  const normalized = normalizeSpeechText(transcript);
  const { name: customerName, rest } = extractCustomer(normalized);
  const items = splitSegments(rest)
    .map(parseSegment)
    .filter(Boolean)
    .slice(0, 30);
  return { customerName: customerName || '', items };
}
