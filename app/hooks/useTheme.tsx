"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Initialiser le thème au chargement
  useEffect(() => {
    // Vérifier si un thème est stocké dans localStorage
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem("theme") as Theme | null : null;
    
    // Vérifier la préférence système
    const prefersDark = typeof window !== 'undefined' ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;
    
    // Définir le thème initial
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    
    // Appliquer le thème au document
    applyTheme(initialTheme);
  }, []);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem("theme", newTheme);
    }
    applyTheme(newTheme);
  };

  // Fonction pour appliquer le thème au document
  const applyTheme = (theme: Theme) => {
    if (typeof document === 'undefined') return;
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
} 