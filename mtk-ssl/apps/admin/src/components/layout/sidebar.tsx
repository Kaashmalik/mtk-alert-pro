"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@mtk/ui/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "📊" },
  { name: "Revenue", href: "/revenue", icon: "💰" },
  { name: "Leagues", href: "/leagues", icon: "🏆" },
  { name: "Users", href: "/users", icon: "👥" },
  { name: "Announcements", href: "/announcements", icon: "📢" },
  { name: "Feature Flags", href: "/feature-flags", icon: "🚩" },
  { name: "Commission", href: "/commission", icon: "💳" },
  { name: "White-Label", href: "/white-label", icon: "🎨" },
  { name: "System Health", href: "/system-health", icon: "⚡" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center border-b border-border/40 px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          SSL Admin
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/40 p-4">
        <div className="rounded-lg bg-muted/30 p-3 text-xs">
          <div className="font-medium text-foreground">Super Admin</div>
          <div className="text-muted-foreground">kashif@maliktech.pk</div>
        </div>
      </div>
    </div>
  );
}

