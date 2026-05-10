-- -----------------------------------------------------------------------------
-- Promo system: add promo columns to wl_tenants, create owner/session tables
-- -----------------------------------------------------------------------------

-- 1. Add missing columns to wl_tenants
ALTER TABLE wl_tenants
  ADD COLUMN IF NOT EXISTS is_promo boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_claim_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS promo_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS promo_claimed_by_email text,
  ADD COLUMN IF NOT EXISTS emails_limit integer DEFAULT 500,
  ADD COLUMN IF NOT EXISTS emails_sent_this_month integer DEFAULT 0;

-- Fix plan check to include 'pro'
ALTER TABLE wl_tenants
  DROP CONSTRAINT IF EXISTS wl_tenants_plan_check;

ALTER TABLE wl_tenants
  ADD CONSTRAINT wl_tenants_plan_check
  CHECK (plan IN ('starter','pro','studio','agency'));

-- 2. Owner credentials table (password-based auth for promo + paid tenants)
CREATE TABLE IF NOT EXISTS wl_tenant_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  tenant_id uuid NOT NULL REFERENCES wl_tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  UNIQUE(tenant_id),
  UNIQUE(email)
);

-- 3. Owner sessions table
CREATE TABLE IF NOT EXISTS wl_owner_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  tenant_id uuid NOT NULL REFERENCES wl_tenants(id) ON DELETE CASCADE,
  owner_email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  active boolean DEFAULT true
);

-- 4. Admin users table
CREATE TABLE IF NOT EXISTS wl_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','superadmin')),
  password_hash text NOT NULL,
  active boolean DEFAULT true
);

-- 5. Audit log table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  admin_user_id uuid REFERENCES wl_admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb DEFAULT '{}'
);

-- 6. Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_wl_owner_sessions_token_hash ON wl_owner_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_wl_owner_sessions_tenant_id ON wl_owner_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wl_tenants_promo_token ON wl_tenants(promo_claim_token) WHERE promo_claim_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wl_tenants_is_promo ON wl_tenants(is_promo) WHERE is_promo = true;

-- 7. RLS - service role only (all access via service role client in API routes)
ALTER TABLE wl_tenant_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_owner_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wl_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- No public access - all operations go through service role
CREATE POLICY "service_role_only" ON wl_tenant_owners TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only" ON wl_owner_sessions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only" ON wl_admin_users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_only" ON admin_audit_logs TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
