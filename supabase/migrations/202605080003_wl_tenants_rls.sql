ALTER TABLE wl_tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON wl_tenants;
CREATE POLICY "Service role full access" ON wl_tenants
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
