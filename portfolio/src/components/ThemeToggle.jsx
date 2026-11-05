import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

/**
 * Floating light / dark switch. Rendered once in App so it is available on
 * every page (public + private routes).
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className="theme-toggle no-print"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
