/**
 * Recurring expense helpers (monthly series like rent / electricity).
 * Pure functions over the expense list — no storage side effects.
 */

const monthKey = (d) => {
  const s = String(d || '');
  const m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 7);
};

export const currentMonthKey = () => new Date().toISOString().slice(0, 7);

export const monthKeyLabel = (key) => {
  const [y, m] = String(key || '').split('-');
  const idx = parseInt(m, 10) - 1;
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return (names[idx] || m) + ' ' + String(y || '').slice(2);
};

/**
 * Group recurring expenses into series. A series is identified by
 * seriesId when present, otherwise by `title|category`.
 * Returns [{ seriesId, title, category, amount, vendor, latestDate, latestMonth, count }]
 */
export const getRecurringSeries = (expenses = []) => {
  const map = new Map();
  (Array.isArray(expenses) ? expenses : []).forEach(e => {
    if (!e || !e.recurring) return;
    const sid = e.seriesId || `${(e.title || '').trim().toLowerCase()}|${e.category || ''}`;
    const mk = monthKey(e.date);
    const cur = map.get(sid);
    if (!cur) {
      map.set(sid, {
        seriesId: sid, title: e.title || 'Monthly expense', category: e.category || 'Other',
        amount: parseFloat(e.amount) || 0, vendor: e.vendor || '',
        latestDate: e.date, latestMonth: mk, count: 1
      });
    } else {
      cur.count += 1;
      if (!cur.latestMonth || (mk && mk > cur.latestMonth)) {
        cur.latestMonth = mk;
        cur.latestDate = e.date;
        cur.amount = parseFloat(e.amount) || cur.amount;
        cur.vendor = e.vendor || cur.vendor;
      }
    }
  });
  return [...map.values()];
};

/**
 * Recurring series that have not been posted in the current month yet.
 */
export const getDueRecurring = (expenses = [], now = new Date()) => {
  const cur = now.toISOString().slice(0, 7);
  return getRecurringSeries(expenses).filter(s => s.latestMonth !== cur);
};

/** Build the "post this month" payload for a series. */
export const buildRecurringPostPayload = (series, now = new Date()) => ({
  title: series.title,
  category: series.category,
  amount: series.amount,
  vendor: series.vendor || '',
  date: now.toISOString().split('T')[0],
  recurring: true,
  seriesId: series.seriesId,
  postedFromRecurring: true
});
