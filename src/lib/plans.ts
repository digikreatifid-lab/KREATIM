import type { PlanTier } from "@prisma/client";

/** Single source of truth for package pricing & quotas (PRD §3.4). */
export const FREE_TRIAL_CREDITS = 15;
export const SUBSCRIPTION_PERIOD_DAYS = 30;
export const TOPUP_VALIDITY_DAYS = 90;

export const CREDIT_COST = {
  COPYWRITER: 1,
  DESIGN_HYBRID: 5,
  DESIGN_RENDER: 0,
} as const;

export const BRAND_LIMIT: Record<PlanTier, number> = {
  FREE_TRIAL: 1,
  STARTER: 1,
  GROWTH: 3,
  PRO: 10,
};

export type SubscriptionItem = {
  kind: "SUBSCRIPTION";
  id: "STARTER" | "GROWTH" | "PRO";
  tier: PlanTier;
  name: string;
  priceIdr: number;
  credits: number;
  highlight?: boolean;
};

export type TopupItem = {
  kind: "TOPUP";
  id: "TOPUP_MINI" | "TOPUP_BOOST";
  name: string;
  priceIdr: number;
  credits: number;
};

export const SUBSCRIPTION_PLANS: SubscriptionItem[] = [
  { kind: "SUBSCRIPTION", id: "STARTER", tier: "STARTER", name: "Starter", priceIdr: 99_000, credits: 200 },
  { kind: "SUBSCRIPTION", id: "GROWTH", tier: "GROWTH", name: "Growth", priceIdr: 249_000, credits: 600, highlight: true },
  { kind: "SUBSCRIPTION", id: "PRO", tier: "PRO", name: "Pro / Agency", priceIdr: 499_000, credits: 1500 },
];

export const TOPUP_PACKS: TopupItem[] = [
  { kind: "TOPUP", id: "TOPUP_MINI", name: "Top-Up Mini Pack", priceIdr: 49_000, credits: 100 },
  { kind: "TOPUP", id: "TOPUP_BOOST", name: "Top-Up Boost Pack", priceIdr: 129_000, credits: 300 },
];

export type BillingItem = SubscriptionItem | TopupItem;
export type BillingItemId = BillingItem["id"];

export function getBillingItem(id: string): BillingItem | undefined {
  return [...SUBSCRIPTION_PLANS, ...TOPUP_PACKS].find((i) => i.id === id);
}
