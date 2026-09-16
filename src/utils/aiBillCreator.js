/**
 * AI Bill Creator — customer-history analysis + smart bill drafts.
 *
 * The analysis engine is fully local (works offline, no API key) so the
 * feature works for every user. When the owner has saved a Gemini API key
 * in Settings, generateGeminiInsight() can upgrade the summary paragraph;
 * every caller must fall back to generateLocalInsight() on any failure.
 */
import { computeCustomerLedger } from './invoiceMath';

const itemName = (it) => String(it.itemService || it.name || it.description || '').trim();
const itemQty = (it) => parseFloat(it.qty || it.quantity) || 0;
const itemRate = (it) => parseFloat(it.rate ?? it.price ?? it.unitPrice) || 0;
const round2 = (n) => Math.round((parseFloat(n) || 0) * 100) / 100;

/**
 * Full history analysis for one customer.
 * @returns {{billCount, totalBilled, avgBill, lastBillDate, firstBillDate,
 *   frequencyDays, pendingDue, paidRatio, topItems:[{name,times,avgQty,lastPrice,lastDate}], hasHistory}}
 */
export const analyzeCustomerHistory = (customer, invoices = [], opts = {}) => {
  const { excludeInvoiceId = null } = opts;
  const empty = {
    billCount: 0, totalBilled: 0, avgBill: 0, lastBillDate: null, firstBillDate: null,
    frequencyDays: null, pendingDue: 0, paidRatio: null, topItems: [], hasHistory: false
  };
  if (!customer || (!customer.id && !customer.name)) return empty;

  const mine = invoices
    .filter(inv => inv && !inv.isDeleted && inv.id !== excludeInvoiceId)
    .filter(inv => (customer.id && inv.customerId === customer.id) ||
      (!customer.id && String(inv.customerName || '').toLowerCase() === String(customer.name).toLowerCase()))
    .sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

  if (mine.length === 0) return empty;

  const totalBilled = round2(mine.reduce((s, inv) => s + (parseFloat(inv.grandTotal ?? inv.total) || 0), 0));
  const dates = mine.map(inv => new Date(inv.date || inv.createdAt || 0).getTime()).filter(t => !isNaN(t));

  let frequencyDays = null;
  if (dates.length >= 2) {
    const spanDays = (Math.max(...dates) - Math.min(...dates)) / 86400000;
    frequencyDays = spanDays / (dates.length - 1) > 0
      ? Math.round(spanDays / (dates.length - 1))
      : null;
  }

  // Item frequency table
  const itemsMap = new Map();
  mine.forEach(inv => {
    (Array.isArray(inv.items) ? inv.items : []).forEach(it => {
      const name = itemName(it);
      if (!name) return;
      const e = itemsMap.get(name.toLowerCase()) || { name, times: 0, qtySum: 0, lastPrice: 0, lastDate: null };
      e.times += 1;
      e.qtySum += itemQty(it) || 1;
      const d = inv.date || inv.createdAt || null;
      // mine is sorted newest-first: only trust price from the newest bill(s)
      if (!e.lastDate || (d && new Date(d) >= new Date(e.lastDate))) {
        if (itemRate(it) > 0) e.lastPrice = itemRate(it);
        e.lastDate = d;
      }
      itemsMap.set(name.toLowerCase(), e);
    });
  });

  const topItems = [...itemsMap.values()]
    .sort((a, b) => b.times - a.times || new Date(b.lastDate || 0) - new Date(a.lastDate || 0))
    .slice(0, 6)
    .map(e => ({
      name: e.name,
      times: e.times,
      avgQty: e.times > 0 ? Math.max(1, Math.round((e.qtySum / e.times) * 10) / 10) : 1,
      lastPrice: round2(e.lastPrice),
      lastDate: e.lastDate
    }));

  let pendingDue = 0;
  try {
    const ledger = computeCustomerLedger(customer, invoices, excludeInvoiceId);
    pendingDue = round2(ledger?.totalDue ?? ledger?.customerTotalDue ?? 0);
  } catch (e) { /* ledger is best-effort */ }

  const paidCount = mine.filter(inv => {
    const st = String(inv.paymentStatus || '').toLowerCase();
    return st === 'paid';
  }).length;

  return {
    billCount: mine.length,
    totalBilled,
    avgBill: round2(totalBilled / mine.length),
    lastBillDate: mine[0]?.date || null,
    firstBillDate: mine[mine.length - 1]?.date || null,
    frequencyDays,
    pendingDue,
    paidRatio: mine.length ? Math.round((paidCount / mine.length) * 100) : null,
    topItems,
    hasHistory: true
  };
};

/**
 * One-click draft: the customer's most frequent recent items with their
 * usual quantity and latest price.
 */
export const buildSmartBillDraft = (analysis, selectedNames = null, maxItems = 4) => {
  if (!analysis || !analysis.hasHistory) return [];
  let pool = analysis.topItems;
  if (Array.isArray(selectedNames) && selectedNames.length > 0) {
    const wanted = new Set(selectedNames.map(n => String(n).toLowerCase()));
    pool = pool.filter(it => wanted.has(it.name.toLowerCase()));
  }
  return pool.slice(0, maxItems).map((it, idx) => ({
    id: `ai_${Date.now()}_${idx}`,
    sNo: String(idx + 1),
    name: it.name,
    // Bill-friendly quantity: nearest half unit (2, 1.5, 3 …)
    qty: Math.max(1, Math.round((it.avgQty || 1) * 2) / 2),
    price: it.lastPrice || 0,
    customFields: {}
  }));
};

const fmt = (n, cur) => `${cur}${(Math.round((parseFloat(n) || 0) * 100) / 100).toLocaleString('en-IN')}`;

/** Offline insight paragraph (no API key needed). */
export const generateLocalInsight = (analysis, customer, currency = '₹') => {
  if (!analysis || !analysis.hasHistory) {
    return `${customer?.name || 'This customer'} has no bill history yet — create the first bill and the AI will learn their usual items for one-click prefill next time.`;
  }
  const name = customer?.name || 'This customer';
  const parts = [];
  parts.push(`${name} has ${analysis.billCount} bill${analysis.billCount !== 1 ? 's' : ''} totalling ${fmt(analysis.totalBilled, currency)} (avg ${fmt(analysis.avgBill, currency)})`);
  if (analysis.topItems.length) {
    const usual = analysis.topItems.slice(0, 3).map(it => `${it.name} (${it.times}×)`).join(', ');
    parts.push(`usually orders ${usual}`);
  }
  if (analysis.pendingDue > 0) parts.push(`${fmt(analysis.pendingDue, currency)} is pending`);
  else if (analysis.pendingDue === 0) parts.push('no dues pending');
  if (analysis.lastBillDate) {
    const d = new Date(analysis.lastBillDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    parts.push(`last billed ${d}${analysis.frequencyDays ? ` — roughly every ${analysis.frequencyDays} days` : ''}`);
  }
  return parts.join(', ') + '.';
};

/** Optional Gemini-powered insight. Throws on any failure — caller falls back to local. */
export const generateGeminiInsight = async (analysis, customer, apiKey, currency = '₹') => {
  if (!apiKey) throw new Error('No Gemini API key');
  const prompt = `You are a friendly billing assistant for a small business app. In 2-3 short sentences, summarize this customer's billing history and suggest what to include in their next bill. Output plain text only, no markdown. Currency symbol: ${currency}.
Customer: ${customer?.name || 'Unknown'}
History: ${JSON.stringify({
    bills: analysis.billCount,
    totalBilled: analysis.totalBilled,
    averageBill: analysis.avgBill,
    pendingDue: analysis.pendingDue,
    lastBillDate: analysis.lastBillDate,
    typicalCycleDays: analysis.frequencyDays,
    mostFrequentItems: analysis.topItems.slice(0, 5).map(i => ({ name: i.name, times: i.times, usualQty: i.avgQty, lastPrice: i.lastPrice }))
  })}`;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 200 }
    })
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join(' ')?.trim();
  if (!text) throw new Error('Empty Gemini response');
  return text;
};
