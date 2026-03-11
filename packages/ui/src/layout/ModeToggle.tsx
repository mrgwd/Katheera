"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "../components/button";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  const handleToggleTheme = () => {
    console.log("Mode switched");
    if (theme === "dark") {
      console.log(theme, "Switching to light");
      setTheme("light");
    } else {
      console.log(theme, "Switching to dark");
      setTheme("dark");
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleToggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
