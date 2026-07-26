import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, Award, Clock } from 'lucide-react';
import { invoiceEngine } from '../../../services/invoiceEngine';

const CustomerInsightsPane = ({ customerId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setInsights(null);
      return;
    }

    const fetchInsights = async () => {
      setLoading(true);
      try {
        const allInvoices = await invoiceEngine.getInvoices();
        const customerInvoices = allInvoices.filter(inv => inv.customerId === customerId);
        
        if (customerInvoices.length === 0) {
          setInsights(null);
          return;
        }

        let totalPurchase = 0;
        let pendingDue = 0;
        let lastDate = null;

        customerInvoices.forEach(inv => {
          totalPurchase += (inv.grandTotal || 0);
          pendingDue += (inv.balanceDue || 0);
          const invDate = new Date(inv.date);
          if (!lastDate || invDate > lastDate) lastDate = invDate;
        });

        const avgBill = totalPurchase / customerInvoices.length;

        // Generate Tags
        const tags = [];
        if (pendingDue > 0) tags.push({ text: 'Collect Due', type: 'warning', icon: AlertCircle });
        if (customerInvoices.length > 5) tags.push({ text: 'Frequent Customer', type: 'success', icon: TrendingUp });
        if (totalPurchase > 50000) tags.push({ text: 'VIP Customer', type: 'premium', icon: Award });
        if (tags.length === 0) tags.push({ text: 'Offer Discount', type: 'info', icon: Sparkles });

        setInsights({
          count: customerInvoices.length,
          totalPurchase,
          pendingDue,
          avgBill,
          lastPurchase: lastDate ? lastDate.toLocaleDateString() : 'N/A',
          tags
        });
      } catch (err) {
        console.error("Failed to fetch insights", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [customerId]);

  if (!customerId || loading) return null;
  if (!insights) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        className="overflow-hidden"
      >
        <div className="bg-theme-card/50 border border-theme-accent/20 rounded-xl p-4 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4 relative z-10">
            <Sparkles className="w-4 h-4 text-theme-accent" />
            <h3 className="text-xs font-black uppercase tracking-wider text-theme-primary">AI Insights</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 relative z-10">
            <div>
              <p className="text-[10px] font-bold text-theme-muted uppercase">Past Invoices</p>
              <p className="text-sm font-black text-theme-primary">{insights.count}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-theme-muted uppercase">Total Value</p>
              <p className="text-sm font-black text-theme-success">₹{insights.totalPurchase.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-theme-muted uppercase">Pending Due</p>
              <p className={`text-sm font-black ${insights.pendingDue > 0 ? 'text-theme-danger' : 'text-theme-primary'}`}>
                ₹{insights.pendingDue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-theme-muted uppercase">Avg Bill</p>
              <p className="text-sm font-black text-theme-primary">₹{Math.round(insights.avgBill).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 relative z-10">
            <span className="text-[10px] font-bold text-theme-muted mr-1">Suggestions:</span>
            {insights.tags.map((tag, idx) => {
              const Icon = tag.icon;
              const colorClasses = {
                warning: 'bg-theme-warning/10 text-theme-warning border-theme-warning/20',
                success: 'bg-theme-success/10 text-theme-success border-theme-success/20',
                premium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                info: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              };
              
              return (
                <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold ${colorClasses[tag.type]}`}>
                  <Icon className="w-3 h-3" /> {tag.text}
                </div>
              );
            })}
            
            <div className="ml-auto flex items-center text-[10px] font-bold text-theme-muted">
              <Clock className="w-3 h-3 mr-1" /> Last: {insights.lastPurchase}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CustomerInsightsPane;
