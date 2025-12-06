// Theme types
export type Theme = "dark" | "light";
export type MonacoTheme = "vs-dark" | "light";

// Storage key
const THEME_STORAGE_KEY = "collabplay-theme";

// Get initial theme from localStorage or system preference
export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  // Check system preference
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

// Set theme on document
export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// Get Monaco theme from current theme
export function getMonacoTheme(theme: Theme): MonacoTheme {
  return theme === "light" ? "light" : "vs-dark";
}

// Toggle between themes
export function toggleTheme(): Theme {
  const current =
    (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
  const next: Theme = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

// Initialize theme on app load
export function initializeTheme(): Theme {
  const theme = getInitialTheme();
  setTheme(theme);
  return theme;
}

// Listen for system theme changes
export function watchSystemTheme(callback: (theme: Theme) => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");

  const handler = (e: MediaQueryListEvent) => {
    const theme: Theme = e.matches ? "light" : "dark";
    callback(theme);
  };

  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
}
