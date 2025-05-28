
"use client";

import Link from "next/link";
import { AuthButton } from "@/components/auth/auth-button";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { HeaderLoyaltyPoints } from "./header-loyalty-points";
import { SidebarTrigger } from "@/components/ui/sidebar"; // Added SidebarTrigger import

export function AppHeader() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    // Simplified skeleton for initial render to avoid layout shifts
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
        <div className="flex items-center gap-2">
          {/* Placeholder for trigger and title */}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Placeholders for loyalty, theme, auth */}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-8 w-8 md:h-7 md:w-7" /> {/* Added SidebarTrigger */}
        <Link href="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
          TixQuic
        </Link>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <HeaderLoyaltyPoints />
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <AuthButton />
      </div>
    </header>
  );
}
