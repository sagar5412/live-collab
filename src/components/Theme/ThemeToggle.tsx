import { useState, useEffect, useCallback } from "react";
import { Sun, Moon } from "lucide-react";
import {
  type Theme,
  getInitialTheme,
  setTheme,
  toggleTheme,
} from "@/utils/theme";

interface ThemeToggleProps {
  className?: string;
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeToggle({
  className = "",
  onThemeChange,
}: ThemeToggleProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Initialize theme on mount
  useEffect(() => {
    setTheme(theme);
  }, []);

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
    onThemeChange?.(newTheme);
  }, [onThemeChange]);

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={handleToggle}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle__icon">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </span>
      <span className="theme-toggle__label">
        {theme === "dark" ? "Light" : "Dark"}
      </span>

      <style>{`
        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-normal);
        }
        .theme-toggle:hover {
          background: var(--color-bg-elevated);
          color: var(--color-text-primary);
          border-color: var(--color-accent);
        }
        .theme-toggle__icon {
          display: flex;
          align-items: center;
          color: var(--color-warning);
        }
        [data-theme="light"] .theme-toggle__icon {
          color: var(--color-accent);
        }
        .theme-toggle__label {
          font-weight: 500;
        }
      `}</style>
    </button>
  );
}

export default ThemeToggle;
