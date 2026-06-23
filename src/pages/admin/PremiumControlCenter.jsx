import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Search, Loader2 } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { toast } from 'react-hot-toast';

const PremiumControlCenter = () => {
  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleLookupUser = async () => {
    if (!targetUserId.trim()) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'usersList', targetUserId));
      if (userDoc.exists()) {
        setTargetUserEmail(userDoc.data().email || 'Found user');
        toast.success('User found!');
      } else {
        setTargetUserEmail('User not found');
        toast.error('No user found with this ID.');
      }
    } catch (e) {
      toast.error('Failed to lookup user.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (newPlan) => {
    if (!targetUserId.trim()) {
      toast.error('Enter a user ID first.');
      return;
    }
    setActionLoading(newPlan);
    try {
      const subRef = doc(db, 'subscription', targetUserId);
      const userRef = doc(db, 'usersList', targetUserId);
      const settingsRef = doc(db, 'settings', targetUserId);

      const now = Date.now();
      const durationMs = newPlan === 'trial' ? 7 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000;
      const expiresAt = newPlan === 'free' ? null : now + durationMs;

      await setDoc(subRef, {
        status: newPlan === 'free' ? 'free' : 'premium',
        plan: newPlan,
        activatedAt: newPlan === 'free' ? null : now,
        expiresAt,
        updatedAt: now
      });
      await setDoc(userRef, { planStatus: newPlan === 'free' ? 'free' : 'premium' }, { merge: true });
      await setDoc(settingsRef, { planStatus: newPlan === 'free' ? 'free' : 'premium' }, { merge: true });

      toast.success(`User set to ${newPlan} successfully!`);
    } catch (e) {
      console.error('Override failed:', e);
      toast.error('Failed to update user plan.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Crown className="w-6 h-6 mr-3 text-amber-500" /> Premium Control Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage user subscriptions, feature access, and templates.</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">User Lookup</h3>
        <p className="text-slate-400 text-sm mb-4">Enter a user ID to apply plan overrides.</p>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="Enter Firebase User ID (uid)"
            className="flex-1 bg-slate-800 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 font-semibold"
          />
          <button
            onClick={handleLookupUser}
            disabled={loading}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Lookup
          </button>
        </div>
        {targetUserEmail && (
          <p className="text-slate-300 text-xs font-semibold mb-4">User: {targetUserEmail}</p>
        )}
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">User Override Controls</h3>
        <p className="text-slate-400 text-sm mb-4">Apply plan override to the looked-up user.</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOverride('free')}
            disabled={actionLoading !== null}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            {actionLoading === 'free' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Make Free'}
          </button>
          <button
            onClick={() => handleOverride('premium')}
            disabled={actionLoading !== null}
            className="px-4 py-2 bg-amber-500/20 text-amber-400 text-sm font-bold rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition-all disabled:opacity-50"
          >
            {actionLoading === 'premium' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Make Premium'}
          </button>
          <button
            onClick={() => handleOverride('lifetime')}
            disabled={actionLoading !== null}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            {actionLoading === 'lifetime' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Make Lifetime'}
          </button>
          <button
            onClick={() => handleOverride('trial')}
            disabled={actionLoading !== null}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
          >
            {actionLoading === 'trial' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Give Trial'}
          </button>
          <button
            disabled
            className="px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-xl border border-blue-500/30 opacity-60 cursor-not-allowed"
          >
            Exempt User
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumControlCenter;
