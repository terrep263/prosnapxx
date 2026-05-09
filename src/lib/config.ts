import type { PlanDefinition, PlanKey } from "@/lib/types";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://snapworxxpro.com";

export const planDefinitions: PlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    recommendation: "Solo planners and freelancers just starting out",
    monthlyPrice: 29,
    yearlyPrice: 290,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_STARTER_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_STARTER_YEARLY",
    eventsLimit: 3,
    storageLimitGb: 5,
    features: ["3 events per month", "5 GB storage", "Your logo & colors", "Subdomain included", "SnapWorxx badge shown"]
  },
  {
    key: "pro",
    name: "Pro",
    recommendation: "Active freelancers who need more events",
    monthlyPrice: 49,
    yearlyPrice: 490,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_PRO_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_PRO_YEARLY",
    eventsLimit: 10,
    storageLimitGb: 10,
    features: ["10 events per month", "10 GB storage", "Your logo & colors", "Subdomain included", "SnapWorxx badge shown"]
  },
  {
    key: "studio",
    name: "Studio",
    recommendation: "Small agencies (3–10 people)",
    monthlyPrice: 99,
    yearlyPrice: 990,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_STUDIO_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_STUDIO_YEARLY",
    eventsLimit: 30,
    storageLimitGb: 50,
    features: ["30 events per month", "50 GB storage", "Custom domain support", "No SnapWorxx badge", "Priority support"]
  },
  {
    key: "agency",
    name: "Agency",
    recommendation: "Mid-size agencies (11–50 people)",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    monthlyPriceIdEnv: "WL_STRIPE_PRICE_AGENCY_MONTHLY",
    yearlyPriceIdEnv: "WL_STRIPE_PRICE_AGENCY_YEARLY",
    eventsLimit: -1,
    storageLimitGb: 200,
    features: ["Unlimited events", "200 GB storage", "Custom domain support", "No SnapWorxx badge", "Priority support"]
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
