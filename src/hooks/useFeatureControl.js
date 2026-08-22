import { useState, useEffect, useCallback } from 'react';
import { featureControlEngine } from '../services/featureControlEngine';

export function useFeatureControl(workspaceId) {
  const [features, setFeatures] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    const activeWs = workspaceId || 'default';
    try {
      const [feats, cats] = await Promise.all([
        featureControlEngine.getAllFeatures(activeWs),
        featureControlEngine.getAllCategories(activeWs)
      ]);
      setFeatures(feats);
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load feature control settings:', e);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadSettings();

    const handleUpdate = (e) => {
      const updatedWs = e.detail?.workspaceId || 'default';
      const currentWs = workspaceId || 'default';
      if (!e.detail?.workspaceId || updatedWs === currentWs) {
        loadSettings();
      }
    };

    const handleWorkspaceSwitch = (e) => {
      loadSettings();
    };

    window.addEventListener('billqyro_features_updated', handleUpdate);
    window.addEventListener('billqyro_workspace_changed', handleWorkspaceSwitch);
    return () => {
      window.removeEventListener('billqyro_features_updated', handleUpdate);
      window.removeEventListener('billqyro_workspace_changed', handleWorkspaceSwitch);
    };
  }, [workspaceId, loadSettings]);

  // Synchronous checks using cached state
  const isFeatureEnabled = useCallback((featureId) => {
    if (!featureId) return true;
    if (features[featureId] !== undefined) {
      return Boolean(features[featureId].effectiveEnabled);
    }
    // Safe default during initial mount before async resolve
    return true;
  }, [features]);

  const isCategoryEnabled = useCallback((categoryId) => {
    if (!categoryId) return true;
    if (categories[categoryId] !== undefined) {
      return Boolean(categories[categoryId].enabled);
    }
    return true;
  }, [categories]);

  return {
    features,
    categories,
    loading,
    isFeatureEnabled,
    isCategoryEnabled,
    reload: loadSettings
  };
}
