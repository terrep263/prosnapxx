import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPlanByPriceId } from "@/lib/config";
import { sendTenantWelcomeEmail } from "@/lib/email";
import { toSlug, randomSuffix } from "@/lib/slug";
import { getServiceRoleClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import type { WlTenant } from "@/lib/types";

function mapStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing" || status === "past_due" || status === "canceled") return status;
  if (status === "unpaid" || status === "incomplete_expired") return "canceled";
  return "past_due";
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.flow !== "tenant_signup") return;
  const priceId = session.line_items?.data[0]?.price?.id ?? String(session.metadata.priceId ?? "");
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const plan = getPlanByPriceId(priceId);
  const supabase = getServiceRoleClient();
  const name = String(session.metadata.businessName);
  const ownerEmail = String(session.metadata.ownerEmail ?? session.customer_email);
  const subdomain = String(session.metadata.subdomain);

  const tenantPayload = {
    slug: `${toSlug(name)}-${randomSuffix()}`,
    name,
    owner_email: ownerEmail,
    subdomain,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    plan: plan.key,
    plan_status: "active",
    events_limit: plan.eventsLimit,
    storage_limit_gb: plan.storageLimitGb,
    active: true
  };

  const { data: existing } = await supabase.from("wl_tenants").select("*").eq("subdomain", subdomain).maybeSingle<WlTenant>();
  const result = existing
    ? await supabase.from("wl_tenants").update(tenantPayload).eq("id", existing.id).select("*").single<WlTenant>()
    : await supabase.from("wl_tenants").insert(tenantPayload).select("*").single<WlTenant>();

  if (result.data) {
    await sendTenantWelcomeEmail(result.data);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const plan = getPlanByPriceId(priceId);
  const supabase = getServiceRoleClient();
  await supabase
    .from("wl_tenants")
    .update({
      stripe_price_id: priceId,
      plan: plan.key,
      plan_status: mapStatus(subscription.status),
      events_limit: plan.eventsLimit,
      storage_limit_gb: plan.storageLimitGb,
      active: subscription.status !== "canceled"
    })
    .eq("stripe_subscription_id", subscription.id);
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session.line_items) {
      const expanded = await stripe.checkout.sessions.retrieve(session.id, { expand: ["line_items"] });
      await handleCheckoutCompleted(expanded);
    } else {
      await handleCheckoutCompleted(session);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}
