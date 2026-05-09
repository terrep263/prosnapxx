CREATE TABLE IF NOT EXISTS wl_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  owner_email text NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#7C3AED',
  secondary_color text DEFAULT '#ec4899',
  custom_domain text UNIQUE,
  subdomain text UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan text CHECK (plan IN ('starter','studio','agency')) DEFAULT 'starter',
  plan_status text CHECK (plan_status IN ('active','past_due','canceled','trialing')) DEFAULT 'trialing',
  events_this_month integer DEFAULT 0,
  events_limit integer DEFAULT 10,
  storage_used_gb numeric DEFAULT 0,
  storage_limit_gb integer DEFAULT 10,
  active boolean DEFAULT true
);

NOTIFY pgrst, 'reload schema';
