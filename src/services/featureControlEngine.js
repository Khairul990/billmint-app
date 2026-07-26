import { settingsEngine } from './settingsEngine';
import { FEATURE_REGISTRY, DEFAULT_CATEGORY_STATE } from './featureRegistry';

class FeatureControlEngine {
  constructor() {
    this.SETTINGS_KEY = 'features';
  }

  // --- Internal Helpers ---

  async _getRawSettings(workspaceId) {
    const allSettings = await settingsEngine.getSettings(workspaceId, this.SETTINGS_KEY);
    // Backward compatibility: If no settings exist yet, return empty object.
    return allSettings || {};
  }

  _mergeFeatureState(rawSettings, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return null;

    const stored = rawSettings[featureId] || {};
    
    // Apply safe defaults for missing configurations
    return {
      enabled: stored.enabled !== undefined ? stored.enabled : reg.defaultEnabled,
      settings: { ...reg.settingsSchema, ...(stored.settings || {}) },
      version: stored.version || reg.version,
      updatedAt: stored.updatedAt || null
    };
  }

  _isCategoryEnabledSync(rawSettings, categoryId) {
    const storedCat = rawSettings[`_category_${categoryId}`];
    if (storedCat !== undefined && storedCat.enabled !== undefined) {
      return storedCat.enabled;
    }
    return DEFAULT_CATEGORY_STATE[categoryId] !== undefined ? DEFAULT_CATEGORY_STATE[categoryId] : true;
  }

  // Recursively check dependencies
  _areDependenciesEnabled(rawSettings, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg || !reg.dependencies || reg.dependencies.length === 0) {
      return true;
    }

    for (const depId of reg.dependencies) {
      const depReg = FEATURE_REGISTRY[depId];
      if (!depReg) continue;

      // Dependency must be enabled
      const depState = this._mergeFeatureState(rawSettings, depId);
      if (!depState.enabled) return false;

      // Dependency category must be enabled
      if (!this._isCategoryEnabledSync(rawSettings, depReg.category)) return false;
      
      // Check dependency's dependencies
      if (!this._areDependenciesEnabled(rawSettings, depId)) return false;
    }

    return true;
  }

  // --- Public API ---

  async isEnabled(workspaceId, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return false;

    const rawSettings = await this._getRawSettings(workspaceId);

    // 1. Check category
    if (!this._isCategoryEnabledSync(rawSettings, reg.category)) {
      return false;
    }

    // 2. Check dependencies
    if (!this._areDependenciesEnabled(rawSettings, featureId)) {
      return false;
    }

    // 3. Check feature itself
    const state = this._mergeFeatureState(rawSettings, featureId);
    return state.enabled;
  }

  async getFeature(workspaceId, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return null;

    const rawSettings = await this._getRawSettings(workspaceId);
    const state = this._mergeFeatureState(rawSettings, featureId);
    
    // Calculate effective enabled state
    const categoryEnabled = this._isCategoryEnabledSync(rawSettings, reg.category);
    const dependenciesEnabled = this._areDependenciesEnabled(rawSettings, featureId);
    const effectiveEnabled = state.enabled && categoryEnabled && dependenciesEnabled;

    return {
      ...reg,
      state,
      effectiveEnabled,
      categoryEnabled,
      dependenciesEnabled
    };
  }

  async getFeatureSettings(workspaceId, featureId) {
    const state = await this.getFeature(workspaceId, featureId);
    return state ? state.state.settings : null;
  }

  async updateFeature(workspaceId, featureId, updates, isDemoMode = false) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) throw new Error(`Feature ${featureId} not found in registry`);

    const rawSettings = await this._getRawSettings(workspaceId);
    const currentState = this._mergeFeatureState(rawSettings, featureId);
    
    const newState = {
      ...currentState,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Update draft in settingsEngine
    settingsEngine.updateDraft(workspaceId, this.SETTINGS_KEY, {
      ...rawSettings,
      [featureId]: newState
    });

    // Only publish if not in demo mode
    if (!isDemoMode) {
      await settingsEngine.publish(workspaceId, this.SETTINGS_KEY);
    }
    
    window.dispatchEvent(new CustomEvent('billqyro_features_updated', { detail: { workspaceId } }));

    return newState;
  }

  async toggleFeature(workspaceId, featureId, enabled, isDemoMode = false) {
    return this.updateFeature(workspaceId, featureId, { enabled }, isDemoMode);
  }

  async getCategory(workspaceId, categoryId) {
    const rawSettings = await this._getRawSettings(workspaceId);
    return {
      id: categoryId,
      enabled: this._isCategoryEnabledSync(rawSettings, categoryId)
    };
  }

  async isCategoryEnabled(workspaceId, categoryId) {
    const rawSettings = await this._getRawSettings(workspaceId);
    return this._isCategoryEnabledSync(rawSettings, categoryId);
  }

  async toggleCategory(workspaceId, categoryId, enabled, isDemoMode = false) {
    const rawSettings = await this._getRawSettings(workspaceId);
    const catKey = `_category_${categoryId}`;
    
    settingsEngine.updateDraft(workspaceId, this.SETTINGS_KEY, {
      ...rawSettings,
      [catKey]: {
        enabled,
        updatedAt: new Date().toISOString()
      }
    });

    if (!isDemoMode) {
      await settingsEngine.publish(workspaceId, this.SETTINGS_KEY);
    }
    
    window.dispatchEvent(new CustomEvent('billqyro_features_updated', { detail: { workspaceId } }));
  }

  async getAllFeatures(workspaceId) {
    const rawSettings = await this._getRawSettings(workspaceId);
    const results = {};
    for (const featureId of Object.keys(FEATURE_REGISTRY)) {
      const reg = FEATURE_REGISTRY[featureId];
      const state = this._mergeFeatureState(rawSettings, featureId);
      const categoryEnabled = this._isCategoryEnabledSync(rawSettings, reg.category);
      const dependenciesEnabled = this._areDependenciesEnabled(rawSettings, featureId);
      const effectiveEnabled = state.enabled && categoryEnabled && dependenciesEnabled;

      results[featureId] = {
        ...reg,
        state,
        effectiveEnabled,
        categoryEnabled,
        dependenciesEnabled
      };
    }
    return results;
  }

  async getAllCategories(workspaceId) {
    const rawSettings = await this._getRawSettings(workspaceId);
    const results = {};
    const categories = Array.from(new Set(Object.values(FEATURE_REGISTRY).map(f => f.category)));
    for (const cat of categories) {
      results[cat] = {
        id: cat,
        enabled: this._isCategoryEnabledSync(rawSettings, cat)
      };
    }
    return results;
  }

  // Backward Compatibility Migration (Example placeholder)
  async migrateSettingsSchema(workspaceId) {
    const rawSettings = await this._getRawSettings(workspaceId);
    let migrated = false;
    
    // Iterate through features in rawSettings to check for old schema shapes if needed
    // In Phase 1, the _mergeFeatureState already provides safe defaults.
    
    if (migrated) {
      settingsEngine.updateDraft(workspaceId, this.SETTINGS_KEY, rawSettings);
      await settingsEngine.publish(workspaceId, this.SETTINGS_KEY);
    }
  }
}

export const featureControlEngine = new FeatureControlEngine();
