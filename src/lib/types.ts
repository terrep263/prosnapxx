export type TenantPlan = "starter" | "pro" | "studio" | "agency";
export type TenantStatus = "active" | "past_due" | "canceled" | "trialing";

export type WlTenant = {
  id: string;
  created_at: string;
  slug: string;
  name: string;
  owner_email: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
  subdomain: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: TenantPlan;
  plan_status: TenantStatus;
  events_this_month: number;
  events_limit: number;
  storage_used_gb: number;
  storage_limit_gb: number;
  emails_sent_this_month?: number;
  emails_limit?: number;
  active: boolean;
  is_promo?: boolean;
  promo_claimed?: boolean;
};

export type EventRecord = {
  id: string;
  slug: string;
  name: string;
  title?: string | null;
  owner_email?: string | null;
  cover_photo_url?: string | null;
  cover_photo_path?: string | null;
  created_at?: string;
  tenant_id: string | null;
  [key: string]: unknown;
};

export type PhotoRecord = {
  id: string;
  event_id: string;
  storage_path?: string | null;
  file_path?: string | null;
  url?: string | null;
  public_url?: string | null;
  created_at?: string;
  approved?: boolean | null;
  [key: string]: unknown;
};

export type PlanKey = "starter" | "pro" | "studio" | "agency";

export type BillingInterval = "monthly" | "yearly";

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  recommendation: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceIdEnv: string;
  yearlyPriceIdEnv: string;
  eventsLimit: number;
  storageLimitGb: number;
  features: string[];
};
