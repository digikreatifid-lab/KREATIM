"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "./nav";

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {DASHBOARD_NAV.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href) || (item.href === "/dashboard/brands" && pathname === "/dashboard/onboarding");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "bg-white/12 text-white" : "text-white/60 hover:bg-white/6 hover:text-white",
            )}
          >
            <item.icon className={cn("size-4", active && "text-comet")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
