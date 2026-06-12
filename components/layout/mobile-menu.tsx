"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { haptics } from "@/lib/haptics";
import { useAuth } from "@/modules/auth/auth-context";
import {
  X,
  ScanLine,
  User,
  Phone,
  UsersRound,
  LogOut,
  ImagePlus,
} from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: MenuItem[] = [
  { href: "/scan", label: "Scan Attendance", icon: ScanLine },
  { href: "/students", label: "Students & Staff", icon: UsersRound },
  { href: "/contacts", label: "Emergency Contacts", icon: Phone },
  { href: "/meme-wars-submissions", label: "Meme Wars Submissions", icon: ImagePlus },
  { href: "/profile", label: "Profile", icon: User },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { profile, logout } = useAuth();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const visibleItems = MENU_ITEMS;

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Trap focus and handle escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleLogoutConfirm() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await logout();
      haptics.success();
      setShowSignOutConfirm(false);
      onClose();
    } catch {
      haptics.error();
      setShowSignOutConfirm(false);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Menu panel */}
      <div
        ref={menuRef}
        className={`fixed inset-y-0 right-0 z-50 w-[min(288px,80vw)] bg-white shadow-xl transition-transform duration-200 ease-out pt-[env(safe-area-inset-top)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile?.full_name}</p>
            <p className="truncate text-xs text-muted">{profile?.email}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu items */}
        <div className="flex flex-col py-2">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm transition-colors active:bg-gray-50 ${
                  isActive
                    ? "bg-primary-50 text-primary-500 font-medium"
                    : "text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex w-full items-center gap-3 px-4 py-4 text-sm text-error transition-colors active:bg-gray-50"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out"
        description="You will need to sign in again to continue using the app."
        confirmLabel="Sign Out"
        tone="danger"
        isLoading={isSigningOut}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
