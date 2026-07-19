import * as dbEngine from './dbEngine';

class MigrationEngine {
  constructor() {
    this.currentVersion = 2; // e.g. V2.0 Enterprise
  }

  // Called on app startup or auth ready to ensure schema is up to date
  async runMigrations(workspaceId) {
    if (!workspaceId) return false;

    const settings = await dbEngine.getSettings(workspaceId);
    let schemaVersion = settings?.schemaVersion || 1; // Default to V1

    console.log(`[MigrationEngine] Current schema: V${schemaVersion}, Target schema: V${this.currentVersion}`);

    if (schemaVersion < this.currentVersion) {
      // Run V1 to V2 migration
      if (schemaVersion === 1) {
        console.log(`[MigrationEngine] Running migration V1 -> V2...`);
        await this._migrateV1toV2(workspaceId, settings);
      }
      
      // Update schema version in settings
      const updatedSettings = {
        ...settings,
        schemaVersion: this.currentVersion
      };
      await dbEngine.updateSettings(workspaceId, updatedSettings);
      console.log(`[MigrationEngine] Migration to V${this.currentVersion} completed.`);
      return true;
    }

    return false;
  }

  async _migrateV1toV2(workspaceId, _settings) {
    // Example migration: Map legacy fields to new Enterprise structure
    // e.g. moving `user.brandColor` to `user.theme.brandColor`
    
    // We would also fetch invoices and transform them if necessary.
    // E.g., `await invoiceEngine.getInvoices()` -> update -> `await invoiceEngine.saveInvoice()`
    console.log(`[MigrationEngine] Migrating legacy mappings for workspace ${workspaceId}`);
    return true;
  }
}

export const migrationEngine = new MigrationEngine();
