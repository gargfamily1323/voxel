import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "default" | "classic" | "light";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeCtx | undefined>(undefined);

const STORAGE_KEY = "voxel-theme";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "default";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "default";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-classic", "theme-light");
    if (theme === "classic") root.classList.add("theme-classic");
    if (theme === "light") root.classList.add("theme-light");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
