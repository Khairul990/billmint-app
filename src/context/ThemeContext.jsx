import React, { createContext, useContext, useState, useEffect } from 'react';
import { applyFullTheme, resolveThemeId } from '../hooks/useThemeEngine';
import { settingsEngine } from '../services/settingsEngine';

const ThemeContext = createContext();

const normalizeThemeState = (settings) => ({
  themeId: resolveThemeId(settings.themeColor || settings.themePreset || 'sapphire-noir'),
  darkMode: settings.darkMode === true || settings.darkMode === 'true',
  brandColor: settings.brandColor || null,
  themeType: settings.themeType || 'built-in'
});

export const ThemeProvider = ({ children }) => {
  const [themeState, setThemeState] = useState({
    themeId: 'sapphire-noir',
    darkMode: false,
    brandColor: null,
    themeType: 'built-in'
  });

  useEffect(() => {
    const loadInitialTheme = async () => {
      try {
        const settings = await settingsEngine.getSettings();
        if (settings) {
          setThemeState(normalizeThemeState(settings));
        }
      } catch (e) {
        console.warn('Error loading theme:', e);
      }
    };

    loadInitialTheme();

    const handleSettingsUpdate = (e) => {
      const settings = e.detail;
      if (settings) {
        setThemeState(normalizeThemeState(settings));
      }
    };

    window.addEventListener('billqyro:settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('billqyro:settings-updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    // applyFullTheme reads themeColor/brandColor/themeType/darkMode keys.
    applyFullTheme({
      themeColor: themeState.themeId,
      brandColor: themeState.brandColor,
      themeType: themeState.themeType,
      darkMode: themeState.darkMode
    });
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
      themeState: { themeId: 'sapphire-noir', darkMode: false },
      setThemeState: () => {},
      isDarkMode: false,
      toggleTheme: () => {}
    };
  }
  return {
    ...context,
    isDarkMode: context.themeState?.darkMode ?? false,
    toggleTheme: () => {
      const nextDark = !(context.themeState?.darkMode ?? false);
      // Persist to settings so the choice survives reloads and syncs
      // across every engine surface (anti-flash, favicon, App hook).
      settingsEngine.getSettings().then((current) => {
        const merged = { ...(current || {}), darkMode: nextDark };
        return settingsEngine.saveSettings(merged);
      }).catch((e) => console.warn('Could not persist dark mode:', e));
      context.setThemeState(prev => ({
        ...prev,
        darkMode: nextDark
      }));
    }
  };
};
