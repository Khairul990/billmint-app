import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyTheme } from '../hooks/useThemeEngine';
import { settingsEngine } from '../services/settingsEngine';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeState, setThemeState] = useState({
    themeId: 'obsidian-gold',
    darkMode: false,
    brandColor: null,
    themeType: 'built-in'
  });

  useEffect(() => {
    const loadInitialTheme = async () => {
      try {
        const settings = await settingsEngine.getSettings();
        if (settings) {
          setThemeState({
            themeId: settings.themeColor || settings.themePreset || 'obsidian-gold',
            darkMode: settings.darkMode === true || settings.darkMode === 'true',
            brandColor: settings.brandColor || null,
            themeType: settings.themeType || 'built-in'
          });
        }
      } catch (e) {
        console.warn('Error loading theme:', e);
      }
    };
    
    loadInitialTheme();

    const handleSettingsUpdate = (e) => {
      const settings = e.detail;
      if (settings) {
        setThemeState({
          themeId: settings.themeColor || settings.themePreset || 'obsidian-gold',
          darkMode: settings.darkMode === true || settings.darkMode === 'true',
          brandColor: settings.brandColor || null,
          themeType: settings.themeType || 'built-in'
        });
      }
    };

    window.addEventListener('billqyro:settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('billqyro:settings-updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const effectiveThemeId = themeState.themeType === 'custom' && themeState.brandColor ? 'custom' : themeState.themeId;
    applyTheme(effectiveThemeId, themeState.brandColor, themeState.darkMode);
  }, [themeState]);

  return (
    <ThemeContext.Provider value={{ themeState, setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeState: { themeId: 'obsidian-gold', darkMode: false },
      setThemeState: () => {},
      isDarkMode: false,
      toggleTheme: () => {}
    };
  }
  return {
    ...context,
    isDarkMode: context.themeState?.darkMode ?? false,
    toggleTheme: () => {
      context.setThemeState(prev => ({
        ...prev,
        darkMode: !prev.darkMode
      }));
    }
  };
};
