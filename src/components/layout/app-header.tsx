
"use client";

import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AuthButton } from "@/components/auth/auth-button";
import { AppLogo } from "@/components/icons/app-logo";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";


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
    return ( // Render a placeholder or null during server rendering/initial client render
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
            <div className="flex items-center gap-2">
                <div className="md:hidden">
                 {/* Placeholder for SidebarTrigger */}
                </div>
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <AppLogo className="h-6 w-6 text-primary" />
                <span className="font-bold">TicketSwift</span>
                </Link>
            </div>
            <div className="flex items-center gap-4">
                {/* Placeholder for Theme Toggle */}
                {/* Placeholder for AuthButton */}
            </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <AppLogo className="h-6 w-6 text-primary" />
          <span className="font-bold">TicketSwift</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <AuthButton />
      </div>
    </header>
  );
}
