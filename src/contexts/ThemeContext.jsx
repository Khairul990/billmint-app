import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme } from '../hooks/useThemeEngine';
import { getSettings } from '../services/dbEngine';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeState, setThemeState] = useState({
    themeId: 'obsidian-gold',
    darkMode: false,
    brandColor: null,
    themeType: 'built-in'
  });

  useEffect(() => {
    // Initial load from settings
    const loadInitialTheme = () => {
      const settings = getSettings();
      if (settings) {
        setThemeState({
          themeId: settings.themeColor || settings.themePreset || 'obsidian-gold',
          darkMode: settings.darkMode === true || settings.darkMode === 'true',
          brandColor: settings.brandColor || null,
          themeType: settings.themeType || 'built-in'
        });
      }
    };
    
    loadInitialTheme();

    // Listen for setting updates across the app
    const handleSettingsUpdate = (e) => {
      const settings = e.detail;
      setThemeState({
        themeId: settings.themeColor || settings.themePreset || 'obsidian-gold',
        darkMode: settings.darkMode === true || settings.darkMode === 'true',
        brandColor: settings.brandColor || null,
        themeType: settings.themeType || 'built-in'
      });
    };

    window.addEventListener('billqyro:settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('billqyro:settings-updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    // Apply to DOM whenever state changes
    const effectiveThemeId = themeState.themeType === 'custom' && themeState.brandColor ? 'custom' : themeState.themeId;
    applyTheme(effectiveThemeId, themeState.brandColor, themeState.darkMode);
  }, [themeState]);

  return (
    <ThemeContext.Provider value={{ themeState, setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
