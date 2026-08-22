import { FEATURE_REGISTRY, DEFAULT_CATEGORY_STATE, BUSINESS_SETUP_PRESETS } from './featureRegistry.js';

class FeatureControlEngine {
  constructor() {
    this.SETTINGS_KEY = 'features';
  }

  // --- Internal Helpers ---

  _getSettings() {
    try {
      if (typeof localStorage !== 'undefined') {
        if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
          return JSON.parse(localStorage.getItem('billqyro_demo_settings') || '{}');
        }
        const raw = localStorage.getItem('billqyro_settings');
        if (raw) return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('FeatureControlEngine: error reading settings:', e);
    }
    return {};
  }

  _saveSettings(settings, isDemoMode = false) {
    try {
      if (typeof localStorage !== 'undefined') {
        if (isDemoMode || localStorage.getItem('billqyro_demo_session_active') === 'true') {
          localStorage.setItem('billqyro_demo_settings', JSON.stringify(settings));
        } else {
          localStorage.setItem('billqyro_settings', JSON.stringify(settings));
        }
      }
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('billqyro_sync'));
      }
    } catch (e) {
      console.warn('FeatureControlEngine: error saving settings:', e);
    }
    return settings;
  }

  _getWorkspaceId(workspaceId) {
    if (workspaceId && typeof workspaceId === 'string') return workspaceId;
    const settings = this._getSettings();
    return settings.activeWorkspaceId || 'default';
  }

  _getRawSettings(workspaceId) {
    const wsId = this._getWorkspaceId(workspaceId);
    const settings = this._getSettings();
    
    // Per-workspace feature isolation stored under settings.workspaceFeatures[wsId]
    if (settings.workspaceFeatures && settings.workspaceFeatures[wsId]) {
      return settings.workspaceFeatures[wsId];
    }
    
    // Fallback to root features if default workspace
    if (settings.features && typeof settings.features === 'object') {
      return settings.features;
    }
    
    return {};
  }

  _saveRawSettings(workspaceId, rawFeatures, isDemoMode = false) {
    const wsId = this._getWorkspaceId(workspaceId);
    const settings = this._getSettings();
    
    if (!settings.workspaceFeatures) {
      settings.workspaceFeatures = {};
    }
    
    settings.workspaceFeatures[wsId] = rawFeatures;
    settings.features = rawFeatures; // Keep root features synced for active workspace
    
    if (!isDemoMode) {
      this._saveSettings(settings, isDemoMode);
    }
    
    return settings;
  }

  _mergeFeatureState(rawSettings, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return null;

    const stored = rawSettings[featureId] || {};
    
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

  _areDependenciesEnabled(rawSettings, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg || !reg.dependencies || reg.dependencies.length === 0) {
      return true;
    }

    for (const depId of reg.dependencies) {
      const depReg = FEATURE_REGISTRY[depId];
      if (!depReg) continue;

      // Dependency category must be enabled
      if (!this._isCategoryEnabledSync(rawSettings, depReg.category)) return false;

      // Dependency must be enabled
      const depState = this._mergeFeatureState(rawSettings, depId);
      if (!depState.enabled) return false;
      
      // Check dependency's dependencies
      if (!this._areDependenciesEnabled(rawSettings, depId)) return false;
    }

    return true;
  }

  // --- Public API ---

  async isEnabled(workspaceId, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return false;

    const rawSettings = this._getRawSettings(workspaceId);

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
    return Boolean(state && state.enabled);
  }

  async getFeature(workspaceId, featureId) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return null;

    const rawSettings = this._getRawSettings(workspaceId);
    const state = this._mergeFeatureState(rawSettings, featureId);
    
    const categoryEnabled = this._isCategoryEnabledSync(rawSettings, reg.category);
    const dependenciesEnabled = this._areDependenciesEnabled(rawSettings, featureId);
    const effectiveEnabled = Boolean(state.enabled && categoryEnabled && dependenciesEnabled);

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

    const rawSettings = this._getRawSettings(workspaceId);
    const currentState = this._mergeFeatureState(rawSettings, featureId);
    
    const newState = {
      ...currentState,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const updatedRaw = {
      ...rawSettings,
      [featureId]: newState
    };

    this._saveRawSettings(workspaceId, updatedRaw, isDemoMode);
    
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('billqyro_features_updated', { 
        detail: { workspaceId: this._getWorkspaceId(workspaceId), featureId, enabled: newState.enabled } 
      }));
    }

    return newState;
  }

  async toggleFeature(workspaceId, featureId, enabled, isDemoMode = false) {
    return this.updateFeature(workspaceId, featureId, { enabled }, isDemoMode);
  }

  async getCategory(workspaceId, categoryId) {
    const rawSettings = this._getRawSettings(workspaceId);
    return {
      id: categoryId,
      enabled: this._isCategoryEnabledSync(rawSettings, categoryId)
    };
  }

  async isCategoryEnabled(workspaceId, categoryId) {
    const rawSettings = this._getRawSettings(workspaceId);
    return this._isCategoryEnabledSync(rawSettings, categoryId);
  }

  async toggleCategory(workspaceId, categoryId, enabled, isDemoMode = false) {
    const rawSettings = this._getRawSettings(workspaceId);
    const catKey = `_category_${categoryId}`;
    
    const updatedRaw = {
      ...rawSettings,
      [catKey]: {
        enabled,
        updatedAt: new Date().toISOString()
      }
    };

    this._saveRawSettings(workspaceId, updatedRaw, isDemoMode);
    
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('billqyro_features_updated', { 
        detail: { workspaceId: this._getWorkspaceId(workspaceId), categoryId, enabled } 
      }));
    }
  }

  /**
   * Helper to enable a feature AND all its required parent dependencies and categories recursively
   */
  async enableFeatureWithDependencies(workspaceId, featureId, isDemoMode = false) {
    const reg = FEATURE_REGISTRY[featureId];
    if (!reg) return;

    const rawSettings = { ...this._getRawSettings(workspaceId) };
    const now = new Date().toISOString();

    const activate = (fId) => {
      const fReg = FEATURE_REGISTRY[fId];
      if (!fReg) return;

      // 1. Enable category
      rawSettings[`_category_${fReg.category}`] = { enabled: true, updatedAt: now };

      // 2. Enable prerequisites first
      if (fReg.dependencies && Array.isArray(fReg.dependencies)) {
        fReg.dependencies.forEach(activate);
      }

      // 3. Enable feature itself
      const cur = rawSettings[fId] || {};
      rawSettings[fId] = {
        ...cur,
        enabled: true,
        updatedAt: now
      };
    };

    activate(featureId);

    this._saveRawSettings(workspaceId, rawSettings, isDemoMode);
    
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('billqyro_features_updated', { 
        detail: { workspaceId: this._getWorkspaceId(workspaceId) } 
      }));
    }
  }

  /**
   * Apply a predefined business configuration preset (e.g. just_billing, retail, service)
   */
  async applyBusinessPreset(workspaceId, presetId, isDemoMode = false) {
    const preset = BUSINESS_SETUP_PRESETS.find(p => p.id === presetId);
    if (!preset) throw new Error(`Unknown preset: ${presetId}`);

    const rawSettings = { ...this._getRawSettings(workspaceId) };
    const now = new Date().toISOString();

    // 1. Set category states
    if (preset.enabledCategories && Array.isArray(preset.enabledCategories)) {
      preset.enabledCategories.forEach(catId => {
        rawSettings[`_category_${catId}`] = { enabled: true, updatedAt: now };
      });
    }
    if (preset.disabledCategories && Array.isArray(preset.disabledCategories)) {
      preset.disabledCategories.forEach(catId => {
        rawSettings[`_category_${catId}`] = { enabled: false, updatedAt: now };
      });
    }

    // 2. Set individual feature overrides
    if (preset.featureOverrides) {
      Object.entries(preset.featureOverrides).forEach(([featId, enabled]) => {
        const cur = rawSettings[featId] || {};
        rawSettings[featId] = {
          ...cur,
          enabled,
          updatedAt: now
        };
      });
    }

    this._saveRawSettings(workspaceId, rawSettings, isDemoMode);
    
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('billqyro_features_updated', { 
        detail: { workspaceId: this._getWorkspaceId(workspaceId), presetId } 
      }));
    }
  }

  async getAllFeatures(workspaceId) {
    const rawSettings = this._getRawSettings(workspaceId);
    const result = {};

    for (const featureId of Object.keys(FEATURE_REGISTRY)) {
      const reg = FEATURE_REGISTRY[featureId];
      const state = this._mergeFeatureState(rawSettings, featureId);
      
      const categoryEnabled = this._isCategoryEnabledSync(rawSettings, reg.category);
      const dependenciesEnabled = this._areDependenciesEnabled(rawSettings, featureId);
      const effectiveEnabled = Boolean(state.enabled && categoryEnabled && dependenciesEnabled);

      result[featureId] = {
        ...reg,
        state,
        effectiveEnabled,
        categoryEnabled,
        dependenciesEnabled
      };
    }

    return result;
  }

  async getAllCategories(workspaceId) {
    const rawSettings = this._getRawSettings(workspaceId);
    const categories = Array.from(new Set(Object.values(FEATURE_REGISTRY).map(f => f.category)));
    const result = {};

    for (const catId of categories) {
      result[catId] = {
        id: catId,
        enabled: this._isCategoryEnabledSync(rawSettings, catId)
      };
    }

    return result;
  }
}

export const featureControlEngine = new FeatureControlEngine();
