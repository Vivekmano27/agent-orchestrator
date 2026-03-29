'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  /** The default theme when no preference has been stored yet. */
  defaultTheme?: Theme;
  /** Key used in localStorage to persist the user's choice. */
  storageKey?: string;
}

interface ThemeContext {
  /** The user's selected preference (may be "system"). */
  theme: Theme;
  /** The resolved theme that is actually applied ("light" or "dark"). */
  resolvedTheme: 'light' | 'dark';
  /** Update the theme preference. */
  setTheme: (theme: Theme) => void;
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                    */
/* -------------------------------------------------------------------------- */

const ThemeContext = createContext<ThemeContext | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/*  Helper: resolve "system" to an actual theme                                */
/* -------------------------------------------------------------------------- */

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/* -------------------------------------------------------------------------- */
/*  Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'saas-dashboard-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') return getSystemTheme();
    return theme;
  });

  /* ------ Apply the class to <html> whenever resolved theme changes ------- */

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    // Set CSS custom properties for semantic color aliases
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--color-background', '#030712');     // gray-950
      root.style.setProperty('--color-foreground', '#f9fafb');     // gray-50
      root.style.setProperty('--color-muted', '#1f2937');          // gray-800
      root.style.setProperty('--color-muted-foreground', '#9ca3af'); // gray-400
      root.style.setProperty('--color-border', '#374151');         // gray-700
      root.style.setProperty('--color-input', '#374151');          // gray-700
      root.style.setProperty('--color-ring', '#2563eb');           // primary-600
      root.style.setProperty('--color-card', '#111827');           // gray-900
      root.style.setProperty('--color-card-foreground', '#f9fafb'); // gray-50
    } else {
      root.style.setProperty('--color-background', '#ffffff');
      root.style.setProperty('--color-foreground', '#030712');     // gray-950
      root.style.setProperty('--color-muted', '#f3f4f6');          // gray-100
      root.style.setProperty('--color-border', '#e5e7eb');         // gray-200
      root.style.setProperty('--color-muted-foreground', '#6b7280'); // gray-500
      root.style.setProperty('--color-input', '#e5e7eb');          // gray-200
      root.style.setProperty('--color-ring', '#3b82f6');           // primary-500
      root.style.setProperty('--color-card', '#ffffff');
      root.style.setProperty('--color-card-foreground', '#030712'); // gray-950
    }
  }, [resolvedTheme]);

  /* ------ Listen for OS-level theme changes when mode is "system" --------- */

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  /* ------ Public setter --------------------------------------------------- */

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem(storageKey, newTheme);

      if (newTheme === 'system') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(newTheme);
      }
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useTheme(): ThemeContext {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>');
  }
  return context;
}
