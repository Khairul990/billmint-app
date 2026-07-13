import * as dbEngine from './dbEngine';

class AutomationEngine {
  constructor() {
    this.jobs = new Map(); // Store in-memory scheduled jobs if running in client
  }

  // Configuration management for automations
  async getAutomationSettings(workspaceId) {
    const settings = await dbEngine.getSettings(workspaceId);
    return settings?.automations || {
      autoBackup: false,
      backupFrequency: 'weekly', // daily, weekly, monthly
      paymentReminders: false,
      reminderDays: [3, 7], // Days after due date to send reminders
      recurringInvoices: true
    };
  }

  async updateAutomationSettings(workspaceId, config) {
    const settings = await dbEngine.getSettings(workspaceId);
    const updatedSettings = {
      ...settings,
      automations: {
        ...(settings?.automations || {}),
        ...config
      }
    };
    await dbEngine.updateSettings(workspaceId, updatedSettings);
    return updatedSettings.automations;
  }

  // Evaluate and trigger pending automations
  // In a real PWA this might run via Service Worker or Sync Worker on app load
  async processAutomations(workspaceId) {
    const automations = await this.getAutomationSettings(workspaceId);

    // Example: Process scheduled backups
    if (automations.autoBackup) {
      await this._processAutoBackup(workspaceId, automations.backupFrequency);
    }

    // Example: Process payment reminders
    if (automations.paymentReminders) {
      await this._processPaymentReminders(workspaceId, automations.reminderDays);
    }

    // Example: Process recurring invoices
    if (automations.recurringInvoices) {
      await this._processRecurringInvoices(workspaceId);
    }
  }

  async _processAutoBackup(workspaceId, frequency) {
    const lastBackupDate = localStorage.getItem(`billqyro_last_backup_${workspaceId}`);
    const now = new Date();
    let shouldBackup = false;

    if (!lastBackupDate) {
      shouldBackup = true;
    } else {
      const last = new Date(lastBackupDate);
      const diffTime = Math.abs(now - last);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (frequency === 'daily' && diffDays >= 1) shouldBackup = true;
      if (frequency === 'weekly' && diffDays >= 7) shouldBackup = true;
      if (frequency === 'monthly' && diffDays >= 30) shouldBackup = true;
    }

    if (shouldBackup) {
      // Assuming backupEngine is available globally or injected
      console.log(`[Automation] Triggering ${frequency} auto-backup for ${workspaceId}`);
      // await backupEngine.createLocalBackup();
      localStorage.setItem(`billqyro_last_backup_${workspaceId}`, now.toISOString());
    }
  }

  async _processPaymentReminders(workspaceId, daysArray) {
    // Logic to query overdue invoices and trigger notificationEngine
    console.log(`[Automation] Processing payment reminders for days: ${daysArray.join(', ')}`);
  }

  async _processRecurringInvoices(workspaceId) {
    // Logic to duplicate invoices marked as recurring if the interval has passed
    console.log(`[Automation] Processing recurring invoices`);
  }
}

export const automationEngine = new AutomationEngine();
