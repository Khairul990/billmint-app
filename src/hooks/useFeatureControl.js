import { useState, useEffect, useCallback } from 'react';
import { featureControlEngine } from '../services/featureControlEngine';

export function useFeatureControl(workspaceId) {
  const [features, setFeatures] = useState({});
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!workspaceId) {
      setFeatures({});
      setCategories({});
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [feats, cats] = await Promise.all([
        featureControlEngine.getAllFeatures(workspaceId),
        featureControlEngine.getAllCategories(workspaceId)
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
      if (updatedWs === currentWs) {
        loadSettings();
      }
    };

    window.addEventListener('billqyro_features_updated', handleUpdate);
    return () => window.removeEventListener('billqyro_features_updated', handleUpdate);
  }, [workspaceId, loadSettings]);

  // Synchronous checks using cached state
  const isFeatureEnabled = useCallback((featureId) => {
    if (!features[featureId]) return false; // Default safe false if loading or unknown
    return features[featureId].effectiveEnabled;
  }, [features]);

  const isCategoryEnabled = useCallback((categoryId) => {
    if (!categories[categoryId]) return false; // Default safe false
    return categories[categoryId].enabled;
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
