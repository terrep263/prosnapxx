import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { z } from "zod";
import crypto from "crypto";

const OWNER_COOKIE = "swp_owner_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const schema = z.object({
  token: z.string().min(1),
  businessName: z.string().min(2).max(120),
  ownerEmail: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { token, businessName, ownerEmail, password } = body.data;
  const supabase = getServiceRoleClient();

  // Find unclaimed promo account
  const { data: tenant } = await supabase
    .from("wl_tenants")
    .select("*")
    .eq("promo_claim_token", token)
    .eq("is_promo", true)
    .eq("promo_claimed", false)
    .eq("active", true)
    .single();

  if (!tenant) return NextResponse.json({ error: "This link is invalid or has already been used." }, { status: 404 });

  // Hash password
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  const passwordHash = `${salt}:${hash}`;

  // Update tenant with claim info
  await supabase.from("wl_tenants").update({
    name: businessName,
    owner_email: ownerEmail,
    promo_claimed: true,
    promo_claimed_at: new Date().toISOString(),
    promo_claimed_by_email: ownerEmail,
    plan_status: "active",
  }).eq("id", tenant.id);

  // Store owner credentials
  await supabase.from("wl_tenant_owners").upsert({
    tenant_id: tenant.id,
    email: ownerEmail.toLowerCase(),
    password_hash: passwordHash,
  }, { onConflict: "tenant_id" });

  // Auto-create session so they land directly in the dashboard
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("wl_owner_sessions").insert({
    tenant_id: tenant.id,
    owner_email: ownerEmail.toLowerCase(),
    token_hash: tokenHash,
    expires_at: expiresAt,
    active: true,
  });

  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://snapworxxpro.com").hostname;
  const tenantHost = tenant.custom_domain ?? `${tenant.subdomain}.${appHost}`;

  const response = NextResponse.json({
    ok: true,
    subdomain: tenant.subdomain,
    tenantHost,
    dashboardUrl: `https://${tenantHost}/tenant`,
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
