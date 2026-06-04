'use client';

import {
  createContext,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type ThemeName = 'light' | 'dark' | 'system';
type SystemTheme = 'light' | 'dark';
type ThemeAttribute = 'class' | `data-${string}`;

type ThemeProviderProps = {
  children: ReactNode;
  attribute?: ThemeAttribute | ThemeAttribute[];
  defaultTheme?: ThemeName;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  themes?: ThemeName[];
  value?: Record<string, string>;
};

type ThemeContextValue = {
  theme: ThemeName;
  resolvedTheme: SystemTheme;
  systemTheme: SystemTheme;
  themes: ThemeName[];
  setTheme: (value: SetStateAction<ThemeName>) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_THEMES: ThemeName[] = ['light', 'dark'];
const MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemTheme(): SystemTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light';
}

function getStoredTheme(storageKey: string, fallback: ThemeName): ThemeName {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // Ignore storage access errors in private or restricted contexts.
  }

  return fallback;
}

function getResolvedTheme(theme: ThemeName, systemTheme: SystemTheme, enableSystem: boolean): SystemTheme {
  if (theme === 'system') return enableSystem ? systemTheme : 'light';
  return theme;
}

export function ThemeProvider({
  children,
  attribute = 'data-theme',
  defaultTheme = 'system',
  enableSystem = true,
  enableColorScheme = true,
  storageKey = 'theme',
  themes = DEFAULT_THEMES,
  value,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<SystemTheme>('light');

  const resolvedTheme = getResolvedTheme(theme, systemTheme, enableSystem);

  const setTheme = useCallback((nextTheme: SetStateAction<ThemeName>) => {
    setThemeState((currentTheme) => {
      const resolvedNextTheme = typeof nextTheme === 'function' ? nextTheme(currentTheme) : nextTheme;

      try {
        window.localStorage.setItem(storageKey, resolvedNextTheme);
      } catch {
        // The visual state can still update even when localStorage is unavailable.
      }

      return resolvedNextTheme;
    });
  }, [storageKey]);

  useEffect(() => {
    setThemeState(getStoredTheme(storageKey, defaultTheme));
    setSystemTheme(getSystemTheme());
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MEDIA_QUERY);
    const handleChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const attributes = Array.isArray(attribute) ? attribute : [attribute];
    const themeValue = value?.[resolvedTheme] ?? resolvedTheme;

    attributes.forEach((attr) => {
      if (attr === 'class') {
        const classNames = themes.map((themeName) => value?.[themeName] ?? themeName);
        root.classList.remove(...classNames);
        root.classList.add(themeValue);
      } else {
        root.setAttribute(attr, themeValue);
      }
    });

    if (enableColorScheme) {
      root.style.colorScheme = resolvedTheme;
    }
  }, [attribute, enableColorScheme, resolvedTheme, themes, value]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      setThemeState(getStoredTheme(storageKey, defaultTheme));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [defaultTheme, storageKey]);

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    systemTheme,
    themes: enableSystem ? [...themes, 'system'] : themes,
    setTheme,
  }), [enableSystem, resolvedTheme, setTheme, systemTheme, theme, themes]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
