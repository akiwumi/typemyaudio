"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Home,
  Upload,
  FileText,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "New Transcription", href: "/dashboard/upload", icon: Upload },
  { label: "My Transcriptions", href: "/dashboard/transcriptions", icon: FileText },
  { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-white">
      <div className="flex items-center gap-3 p-6 border-b border-border">
        <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-14 w-auto" />
      </div>

      <nav className="flex-1 space-y-0.5 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary-light text-primary font-semibold"
                  : "text-foreground-muted hover:bg-surface hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary text-sm font-semibold">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-foreground-muted capitalize">{profile?.tier || "Free"} plan</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground-muted hover:bg-surface hover:text-foreground transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
