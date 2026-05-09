import type { PlanDefinition, PlanKey } from "@/lib/types";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wl.snapworxx.com";

export const planDefinitions: PlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    recommendation: "Solo planners and freelancers",
    monthlyPrice: 49,
    yearlyPrice: 490,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_STARTER_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_STARTER_YEARLY",
    eventsLimit: 10,
    storageLimitGb: 10,
    features: ["10 events per month", "10 GB branded gallery storage", "Custom colors and logo", "Subdomain included"]
  },
  {
    key: "studio",
    name: "Studio",
    recommendation: "Small agencies and venue teams",
    monthlyPrice: 99,
    yearlyPrice: 990,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_STUDIO_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_STUDIO_YEARLY",
    eventsLimit: 30,
    storageLimitGb: 50,
    features: ["30 events per month", "50 GB branded gallery storage", "Custom domain support", "Priority event workflows"]
  },
  {
    key: "agency",
    name: "Agency",
    recommendation: "Multi-location and corporate teams",
    monthlyPrice: 179,
    yearlyPrice: 1790,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_AGENCY_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_AGENCY_YEARLY",
    eventsLimit: -1,
    storageLimitGb: 200,
    features: ["Unlimited monthly events", "200 GB branded gallery storage", "Custom domain support", "High-volume sharing tools"]
  }
];

export function getPlanByKey(key: string | null | undefined): PlanDefinition {
  return planDefinitions.find((plan) => plan.key === key) ?? planDefinitions[0];
}

export function getPriceId(plan: PlanKey, interval: "monthly" | "yearly") {
  const definition = getPlanByKey(plan);
  const envKey = interval === "monthly" ? definition.monthlyPriceIdEnv : definition.yearlyPriceIdEnv;
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} is not configured`);
  }
  return priceId;
}

export function getPlanByPriceId(priceId: string | null | undefined): PlanDefinition {
  return (
    planDefinitions.find(
      (plan) => process.env[plan.monthlyPriceIdEnv] === priceId || process.env[plan.yearlyPriceIdEnv] === priceId
    ) ?? planDefinitions[0]
  );
}
