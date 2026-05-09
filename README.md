# SnapWorxx Whitelabel

Next.js 15 App Router frontend for multi-tenant, fully branded event photo sharing.

## Environment

Copy `.env.example` to `.env.local` and fill in the shared Supabase, Stripe, and Resend values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ofmzpgbuawtwtzgrtiwr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://wl.snapworxx.com
NEXT_PUBLIC_MAIN_APP_URL=https://snapworxx.com
RESEND_API_KEY=
RESEND_FROM_EMAIL=SnapWorxx <noreply@snapworxx.com>
WL_STRIPE_PRICE_STARTER_MONTHLY=
WL_STRIPE_PRICE_STARTER_YEARLY=
WL_STRIPE_PRICE_STUDIO_MONTHLY=
WL_STRIPE_PRICE_STUDIO_YEARLY=
WL_STRIPE_PRICE_AGENCY_MONTHLY=
WL_STRIPE_PRICE_AGENCY_YEARLY=
```

`SUPABASE_PHOTO_BUCKET` is optional and defaults to `event-photos`.

## Database

Run the migrations in `supabase/migrations` before serving traffic:

1. Create `wl_tenants`
2. Add `events.tenant_id`
3. Enable RLS policy for service role access
4. Schedule the monthly tenant event counter reset

The monthly reset uses:

```sql
SELECT cron.schedule(
  'reset-wl-monthly-counts',
  '0 0 1 * *',
  $$ UPDATE wl_tenants SET events_this_month = 0 $$
);
```

## Stripe

Create six recurring prices and place the resulting price IDs in `.env.local`:

- `WL_STRIPE_PRICE_STARTER_MONTHLY`
- `WL_STRIPE_PRICE_STARTER_YEARLY`
- `WL_STRIPE_PRICE_STUDIO_MONTHLY`
- `WL_STRIPE_PRICE_STUDIO_YEARLY`
- `WL_STRIPE_PRICE_AGENCY_MONTHLY`
- `WL_STRIPE_PRICE_AGENCY_YEARLY`

Configure a webhook endpoint at `/api/stripe-webhook` with:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Custom Domains

Tenant custom domain setup requires:

1. The tenant adds a CNAME record for their desired host, such as `photos.theirvenue.com`, pointing to `wl.snapworxx.com`.
2. The tenant enters that full hostname in Tenant Settings.
3. Coolify/Traefik provisions SSL through Let's Encrypt after DNS resolves.

No tenant-specific code changes are needed. `src/middleware.ts` resolves requests by exact `custom_domain` first, then by whitelabel subdomain.

## Development

```bash
npm install
npm run dev
```

Guest-facing pages never display platform branding. Tenant resolution and scoping are enforced in middleware and repeated in server-side data queries.
