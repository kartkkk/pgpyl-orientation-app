"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Trophy, Bell, FileText, MoreHorizontal } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; fill?: string; strokeWidth?: number }>;
  matchPrefix: string;
  fillOnActive?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/events", label: "Events", icon: Calendar, matchPrefix: "/events" },
  { href: "/wars", label: "Wars", icon: Trophy, matchPrefix: "/wars", fillOnActive: true },
  { href: "/alerts", label: "Alerts", icon: Bell, matchPrefix: "/alerts" },
  { href: "/documents", label: "Resources", icon: FileText, matchPrefix: "/documents" },
];

interface BottomNavProps {
  onMenuPress: () => void;
}

export function BottomNav({ onMenuPress }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14 items-stretch">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.matchPrefix);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive
                  ? "text-primary-500 font-medium"
                  : "text-muted"
              }`}
            >
              <item.icon
                className="h-5 w-5"
                fill={isActive && item.fillOnActive ? "currentColor" : "none"}
                strokeWidth={isActive && item.fillOnActive ? 1.5 : 2}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuPress}
          aria-label="Open menu"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-xs text-muted transition-colors active:text-primary-500"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
