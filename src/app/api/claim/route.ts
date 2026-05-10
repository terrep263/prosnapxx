import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { sendPromoWelcomeEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const OWNER_COOKIE = "swp_owner_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const schema = z.object({
  token: z.string().min(1),
  businessName: z.string().min(2).max(120),
  ownerEmail: z.string().email(),
  password: z.string().min(8).max(256),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token, businessName, ownerEmail, password } = parsed.data;
  const supabase = getServiceRoleClient();

  // 1. Find the unclaimed promo account matching this token
  const { data: tenant } = await supabase
    .from("wl_tenants")
    .select("id, subdomain, custom_domain, name, primary_color, plan_status, active")
    .eq("promo_claim_token", token)
    .eq("is_promo", true)
    .eq("promo_claimed", false)
    .eq("active", true)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "This link is invalid, has already been used, or has been revoked." },
      { status: 404 }
    );
  }

  // 2. Check email not already used by another tenant owner
  const { data: existingOwner } = await supabase
    .from("wl_tenant_owners")
    .select("id")
    .eq("email", ownerEmail.toLowerCase())
    .maybeSingle();

  if (existingOwner) {
    return NextResponse.json(
      { error: "An account with that email already exists. Please use a different email." },
      { status: 409 }
    );
  }

  // 3. Mark tenant as claimed
  const { error: updateError } = await supabase
    .from("wl_tenants")
    .update({
      name: businessName,
      owner_email: ownerEmail.toLowerCase(),
      promo_claimed: true,
      promo_claimed_at: new Date().toISOString(),
      promo_claimed_by_email: ownerEmail.toLowerCase(),
      plan_status: "active",
    })
    .eq("id", tenant.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to claim account. Please try again." }, { status: 500 });
  }

  // 4. Store owner credentials
  const passwordHash = hashPassword(password);
  await supabase.from("wl_tenant_owners").upsert(
    {
      tenant_id: tenant.id,
      email: ownerEmail.toLowerCase(),
      password_hash: passwordHash,
    },
    { onConflict: "tenant_id" }
  );

  // 5. Create immediate session so they land directly in the dashboard
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("wl_owner_sessions").insert({
    tenant_id: tenant.id,
    owner_email: ownerEmail.toLowerCase(),
    token_hash: tokenHash,
    expires_at: expiresAt,
    active: true,
  });

  // 6. Build redirect URL
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://snapworxxpro.com").hostname;
  const tenantHost = tenant.custom_domain ?? `${tenant.subdomain}.${appHost}`;
  const dashboardUrl = `https://${tenantHost}/tenant?welcome=1`;
  const loginUrl = `https://${tenantHost}/login`;

  // 7. Send welcome email (non-blocking)
  sendPromoWelcomeEmail({
    to: ownerEmail,
    businessName,
    subdomain: tenant.subdomain,
    dashboardUrl,
    loginUrl,
  }).catch(() => {
    // Don't fail the request if email fails
  });

  // 8. Build response with cross-subdomain session cookie
  const response = NextResponse.json({
    ok: true,
    subdomain: tenant.subdomain,
    tenantHost,
    dashboardUrl,
  });

  response.cookies.set(OWNER_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    domain: `.${appHost}`,
  });

  return response;
}
