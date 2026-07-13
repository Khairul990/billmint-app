import { invoiceEngine } from './invoiceEngine';
import * as dbEngine from './dbEngine';
import {  getActiveAnnouncement as dbGetActiveAnnouncement  } from './dbEngine';

class AnalyticsEngine {
  async getDashboardMetrics(workspaceId) {
    // In a real environment, query indexedDB or Firestore through dbEngine
    const invoices = await invoiceEngine.getInvoices();
    
    let totalRevenue = 0;
    let outstandingAmount = 0;
    let paidInvoices = 0;
    let pendingInvoices = 0;

    invoices.forEach(inv => {
      const total = Number(inv.total) || 0;
      const paid = Number(inv.amountPaid) || 0;
      
      totalRevenue += paid;
      outstandingAmount += (total - paid);

      if (inv.status === 'Paid') {
        paidInvoices++;
      } else {
        pendingInvoices++;
      }
    });

    // Basic growth calculation (Mock logic)
    const growth = {
      revenuePercent: 12.5,
      invoicesPercent: 5.2
    };

    return {
      totalRevenue,
      outstandingAmount,
      totalInvoices: invoices.length,
      paidInvoices,
      pendingInvoices,
      growth
    };
  }

  async getRevenueChartData(workspaceId, timeframe = 'month') {
    const invoices = await invoiceEngine.getInvoices();
    // Group invoices by date
    const dataMap = new Map();
    
    invoices.forEach(inv => {
      if (inv.status === 'Paid' || inv.amountPaid > 0) {
        const d = new Date(inv.date || inv.createdAt);
        let key;
        
        if (timeframe === 'month') {
          key = d.toISOString().split('T')[0]; // YYYY-MM-DD
        } else if (timeframe === 'year') {
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        }
        
        const existing = dataMap.get(key) || 0;
        dataMap.set(key, existing + (Number(inv.amountPaid) || 0));
      }
    });

    const sortedKeys = Array.from(dataMap.keys()).sort();
    return sortedKeys.map(key => ({
      date: key,
      revenue: dataMap.get(key)
    }));
  }

  async getPlatformStats() {
    // Admin level stats
    return await dbEngine.getAdminTotalStats();
  }

  async getActiveAnnouncement() {
    return await dbGetActiveAnnouncement();
  }
}

export const analyticsEngine = new AnalyticsEngine();
