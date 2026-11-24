"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clay } from "@/components/clay/clay";
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
              "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              active ? "bg-ink text-white" : "text-ink/70 hover:bg-secondary hover:text-ink",
            )}
          >
            <Clay color={item.color} size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
