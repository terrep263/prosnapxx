import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appUrl, getPriceId } from "@/lib/config";
import { sanitizeSubdomain, isValidSubdomain } from "@/lib/slug";
import { getServiceRoleClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import type { BillingInterval, PlanKey } from "@/lib/types";

const schema = z.object({
  plan: z.enum(["starter", "pro", "studio", "agency"]),
  interval: z.enum(["monthly", "yearly"]),
  businessName: z.string().min(2).max(120),
  ownerEmail: z.string().email(),
  subdomain: z.string()
});

export async function POST(request: NextRequest) {
  const body = schema.parse(await request.json());
  const subdomain = sanitizeSubdomain(body.subdomain);
  if (!isValidSubdomain(subdomain)) {
    return NextResponse.json({ error: "Invalid subdomain" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data: existing } = await supabase.from("wl_tenants").select("id").eq("subdomain", subdomain).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Subdomain is not available" }, { status: 409 });
  }

  const stripe = getStripe();
  const priceId = getPriceId(body.plan as PlanKey, body.interval as BillingInterval);
  const appHost = new URL(appUrl).hostname;
  const tenantSuccessUrl = `https://${subdomain}.${appHost}/tenant?welcome=1`;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: body.ownerEmail,
    success_url: tenantSuccessUrl,
    cancel_url: `${appUrl}/signup`,
    metadata: {
      flow: "tenant_signup",
      businessName: body.businessName,
      ownerEmail: body.ownerEmail,
      subdomain,
      plan: body.plan,
      interval: body.interval
    },
    subscription_data: {
      metadata: {
        flow: "tenant_signup",
        businessName: body.businessName,
        ownerEmail: body.ownerEmail,
        subdomain,
        plan: body.plan
      }
    }
  });

  return NextResponse.json({ url: session.url });
}
