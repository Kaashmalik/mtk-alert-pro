"use client";

import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Button } from "@mtk/ui";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">Super Admin Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

