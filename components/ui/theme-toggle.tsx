"use client";

import { useTheme } from "@/app/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full"
        title={`Basculer en mode ${theme === "light" ? "sombre" : "clair"}`}
      >
        {theme === "light" ? (
          <FiSun className="h-5 w-5 text-orange-500" />
        ) : (
          <FiMoon className="h-5 w-5 text-blue-400" />
        )}
        <span className="sr-only">Changer de thème</span>
      </Button>
    </div>
  );
} 