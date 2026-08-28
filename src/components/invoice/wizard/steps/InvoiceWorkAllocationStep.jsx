import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, UserRound, HandCoins, Building2, Info } from 'lucide-react';
import { useInvoice } from '../../../../context/InvoiceContext';
import { staffEngine } from '../../../../services/staffEngine.js';
import { getVendors } from '../../../../services/outsourceEngine.js';

const TYPE_OPTIONS = [
  { value: 'internal', label: 'নিজের কাজ', icon: BriefcaseBusiness },
  { value: 'staff', label: 'স্টাফ', icon: UserRound },
  { value: 'outsource', label: 'Outsource', icon: Building2 }
];

const money = (value, currency) => `${currency}${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const InvoiceWorkAllocationStep = () => {
  const { state, dispatch, businessSettings } = useInvoice();
  const [staffs, setStaffs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const currency = businessSettings?.currency || '₹';

  useEffect(() => {
    let mounted = true;
    Promise.all([
      staffEngine.getStaffs(false).catch(() => []),
      getVendors(false).catch(() => [])
    ]).then(([staffList, vendorList]) => {
      if (!mounted) return;
      setStaffs(Array.isArray(staffList) ? staffList : []);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
    });
    return () => { mounted = false; };
  }, []);

  const allocations = Array.isArray(state.workAllocations) ? state.workAllocations : [];

  const getAllocation = (itemId) => allocations.find(a => a.itemId === itemId) || null;

  const updateAllocation = (item, patch) => {
    const existing = getAllocation(item.id) || {
      id: `alloc-${item.id}`,
      itemId: item.id,
      itemDescription: item.description || item.item || item.service || 'Item',
      type: 'internal',
      staffId: null,
      staffName: '',
      vendorId: null,
      vendorName: '',
      costAmount: 0,
      note: ''
    };
    const next = { ...existing, ...patch };
    const nextList = allocations.filter(a => a.itemId !== item.id);
    dispatch({ type: 'INIT_INVOICE', payload: { workAllocations: [...nextList, next] } });
  };

  const summary = useMemo(() => {
    return allocations.reduce((acc, a) => {
      const amount = Math.max(0, Number(a.costAmount) || 0);
      if (a.type === 'staff') acc.staff += amount;
      else if (a.type === 'outsource') acc.outsource += amount;
      else acc.internal += amount;
      return acc;
    }, { internal: 0, staff: 0, outsource: 0 });
  }, [allocations]);

  const total = summary.staff + summary.outsource;

  return (
    <div className="bg-theme-card border border-theme-border-soft rounded-3xl p-5 md:p-6 shadow-premium">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-theme-accent/10 text-theme-accent">
          <BriefcaseBusiness className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-theme-primary">কাজের হিসাব</h2>
          <p className="text-sm text-theme-muted font-medium mt-1">
            এই বিলের কোন কাজ আপনি নিজে করেছেন, কোনটা স্টাফ করেছে, আর কোনটা Outsource করা হয়েছে—এখানেই নির্ধারণ করুন।
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-3 rounded-2xl bg-theme-surface border border-theme-border-soft mb-6">
        <Info className="w-5 h-5 text-theme-accent shrink-0 mt-0.5" />
        <p className="text-xs md:text-sm text-theme-muted font-semibold leading-5">
          এখানে দেওয়া টাকা <b className="text-theme-primary">কাজের খরচ/পাওনা</b> হিসেবে ধরা হবে। Customer-এর কাছ থেকে আসা payment আলাদা থাকবে। তাই বিলের revenue এবং staff/outsource cost মিশে যাবে না।
        </p>
      </div>

      <div className="space-y-4">
        {state.items.map((item, index) => {
          const allocation = getAllocation(item.id) || { type: 'internal', costAmount: 0, staffId: null, vendorId: null };
          const itemAmount = Number(item.amount || (Number(item.qty || 0) * Number(item.rate || 0))) || 0;
          const selectedStaff = staffs.find(s => s.id === allocation.staffId);
          const selectedVendor = vendors.find(v => v.id === allocation.vendorId);

          return (
            <div key={item.id} className="p-4 md:p-5 rounded-2xl border border-theme-border-soft bg-theme-surface">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Item {index + 1}</p>
                  <h3 className="text-sm md:text-base font-black text-theme-primary truncate">
                    {item.description || item.item || item.service || 'Unnamed item'}
                  </h3>
                </div>
                <span className="text-sm font-black text-theme-accent whitespace-nowrap">{money(itemAmount, currency)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateAllocation(item, {
                      type: value,
                      staffId: value === 'staff' ? allocation.staffId : null,
                      vendorId: value === 'outsource' ? allocation.vendorId : null,
                      staffName: value === 'staff' ? (selectedStaff?.name || allocation.staffName || '') : '',
                      vendorName: value === 'outsource' ? (selectedVendor?.name || allocation.vendorName || '') : '',
                      costAmount: value === 'internal' ? 0 : allocation.costAmount
                    })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${allocation.type === value ? 'border-theme-accent bg-theme-accent/10 text-theme-accent' : 'border-theme-border-soft bg-theme-card text-theme-muted hover:border-theme-accent/50'}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-black">{label}</span>
                  </button>
                ))}
              </div>

              {allocation.type === 'staff' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <select
                    value={allocation.staffId || ''}
                    onChange={(e) => {
                      const person = staffs.find(s => s.id === e.target.value);
                      updateAllocation(item, { staffId: person?.id || null, staffName: person?.name || person?.staffName || '' });
                    }}
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary outline-none focus:border-theme-accent"
                  >
                    <option value="">স্টাফ নির্বাচন করুন</option>
                    {staffs.map(s => <option key={s.id} value={s.id}>{s.name || s.staffName || 'Unnamed Staff'}</option>)}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={allocation.costAmount || ''}
                    onChange={(e) => updateAllocation(item, { costAmount: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="স্টাফের কাজের টাকা"
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary outline-none focus:border-theme-accent"
                  />
                </div>
              )}

              {allocation.type === 'outsource' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <select
                    value={allocation.vendorId || ''}
                    onChange={(e) => {
                      const vendor = vendors.find(v => v.id === e.target.value);
                      updateAllocation(item, { vendorId: vendor?.id || null, vendorName: vendor?.name || vendor?.vendorName || '' });
                    }}
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary outline-none focus:border-theme-accent"
                  >
                    <option value="">Outsource ব্যক্তি/ভেন্ডর নির্বাচন করুন</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name || v.vendorName || 'Unnamed Vendor'}</option>)}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={allocation.costAmount || ''}
                    onChange={(e) => updateAllocation(item, { costAmount: Math.max(0, Number(e.target.value) || 0) })}
                    placeholder="Outsource কাজের টাকা"
                    className="w-full px-4 py-3 bg-theme-card border border-theme-border-soft rounded-xl text-sm font-bold text-theme-primary outline-none focus:border-theme-accent"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">নিজের কাজ</p>
          <p className="text-lg font-black text-theme-primary mt-1">{money(summary.internal, currency)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">স্টাফ খরচ</p>
          <p className="text-lg font-black text-theme-primary mt-1">{money(summary.staff, currency)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-theme-surface border border-theme-border-soft">
          <p className="text-[10px] font-black uppercase tracking-wider text-theme-muted">Outsource খরচ</p>
          <p className="text-lg font-black text-theme-primary mt-1">{money(summary.outsource, currency)}</p>
        </div>
      </div>

      <div className="mt-4 p-5 rounded-2xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black text-theme-muted uppercase tracking-wider">মোট কাজের খরচ</p>
          <p className="text-xs text-theme-muted font-semibold mt-1">স্টাফ + Outsource</p>
        </div>
        <p className="text-2xl font-black text-theme-accent">{money(total, currency)}</p>
      </div>
    </div>
  );
};

export default InvoiceWorkAllocationStep;
