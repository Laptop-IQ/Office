import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Theme system
 * ------------
 * "dark"  → the original look of the app (default, unchanged).
 * "light" → new light theme.
 *
 * The active theme is stored on <html data-theme="…"> so that plain CSS
 * (see src/theme.css) can switch every colour variable at once, and it is
 * persisted in localStorage under THEME_KEY. A tiny inline script in
 * index.html applies the saved value before React mounts to avoid a flash.
 */

export const THEME_KEY = "theme";
const THEMES = ["dark", "light"];

const readStoredTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return THEMES.includes(saved) ? saved : "dark";
  } catch {
    return "dark";
  }
};

const ThemeContext = createContext({
  theme: "dark",
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  // Keep <html data-theme> and localStorage in sync with state.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable (private mode etc.) – theme still works */
    }
  }, [theme]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === THEME_KEY && THEMES.includes(e.newValue)) {
        setThemeState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next) => {
    if (THEMES.includes(next)) setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
