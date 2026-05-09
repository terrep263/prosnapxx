ALTER TABLE events ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES wl_tenants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
NOTIFY pgrst, 'reload schema';
