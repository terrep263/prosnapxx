CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
  'reset-wl-monthly-counts',
  '0 0 1 * *',
  $$ UPDATE wl_tenants SET events_this_month = 0 $$
);
