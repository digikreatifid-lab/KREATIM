import type { ClayColor } from "@/components/clay/clay";

export type NavItem = { href: string; label: string; color: ClayColor };

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Beranda", color: "violet" },
  { href: "/dashboard/brands", label: "Brand Brain", color: "lilac" },
  { href: "/dashboard/copywriter", label: "Agent Penulis", color: "butter" },
  { href: "/dashboard/design", label: "Agent Desain", color: "guava" },
  { href: "/dashboard/billing", label: "Paket & Billing", color: "mint" },
];
