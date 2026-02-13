import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colorScheme as nativewindColorScheme } from 'nativewind';

const THEME_KEY = '@app_theme';

export type AppTheme = 'light' | 'dark';

export function useTheme() {
  const [darkMode, setDarkMode] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        const isDark = saved === 'dark';
        setDarkMode(isDark);
        nativewindColorScheme.set(isDark ? 'dark' : 'light');
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setIsThemeReady(true);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !darkMode;
    setDarkMode(next);
    const value: AppTheme = next ? 'dark' : 'light';
    nativewindColorScheme.set(value);
    try {
      await AsyncStorage.setItem(THEME_KEY, value);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  };

  const setTheme = async (value: AppTheme) => {
    const isDark = value === 'dark';
    setDarkMode(isDark);
    nativewindColorScheme.set(value);
    try {
      await AsyncStorage.setItem(THEME_KEY, value);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  };

  return { darkMode, isThemeReady, toggleTheme, setTheme };
}