import { CreditCard, Brain, House, Palette, PenLine, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "Beranda", icon: House },
  { href: "/dashboard/brands", label: "Brand Brain", icon: Brain },
  { href: "/dashboard/copywriter", label: "Agent Penulis", icon: PenLine },
  { href: "/dashboard/design", label: "Agent Desain", icon: Palette },
  { href: "/dashboard/billing", label: "Paket & Billing", icon: CreditCard },
];
