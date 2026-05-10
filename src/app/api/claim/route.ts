import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import { z } from "zod";

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

  // Hash password using scrypt
  const crypto = await import("crypto");
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

  // Store owner password in a simple auth table (reuse admin_users pattern)
  await supabase.from("wl_tenant_owners").upsert({
    tenant_id: tenant.id,
    email: ownerEmail,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, subdomain: tenant.subdomain });
}
