"use client";

import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";
  const isGlass = localStorage.getItem("glass-mode") === "true";

  const toggleDarkMode = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const toggleGlassMode = () => {
    const newGlassMode = !isGlass;
    localStorage.setItem("glass-mode", String(newGlassMode));
    document.documentElement.classList.toggle("glass", newGlassMode);
    window.dispatchEvent(new CustomEvent("glassModeChange", { detail: { enabled: newGlassMode } }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleDarkMode}>
          {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          <span>{isDark ? "Light" : "Dark"} Mode</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleGlassMode}>
          <Sparkles className={`mr-2 h-4 w-4 ${isGlass ? "text-yellow-500" : ""}`} />
          <span>Glass Mode {isGlass ? "On" : "Off"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
