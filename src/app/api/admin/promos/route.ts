import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, auditLog } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function generateSubdomain(label?: string): string {
  const base = label
    ? label.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)
    : "";
  const suffix = crypto.randomBytes(4).toString("hex");
  return base ? `${base}-${suffix}` : `promo-${suffix}`;
}

// ── GET: list all promo accounts ──────────────────────────────────────────────

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("wl_tenants")
    .select("id, name, subdomain, active, promo_claimed, promo_claimed_at, promo_claimed_by_email, promo_claim_token, plan_status, created_at")
    .eq("is_promo", true)
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}

// ── POST: create a new promo account ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const label: string = (body.label ?? "").toString().trim();
  const count: number = Math.min(Math.max(parseInt(body.count ?? "1", 10) || 1, 1), 20);

  const supabase = getServiceRoleClient();
  const created: { id: string; subdomain: string; token: string }[] = [];

  for (let i = 0; i < count; i++) {
    let subdomain = generateSubdomain(label || undefined);
    // Collision guard — retry once
    const { data: existing } = await supabase.from("wl_tenants").select("id").eq("subdomain", subdomain).maybeSingle();
    if (existing) subdomain = generateSubdomain();

    const token = generateToken();
    const slug = `${subdomain}-${Date.now().toString(36)}`;

    const { data: tenant, error } = await supabase
      .from("wl_tenants")
      .insert({
        slug,
        name: label ? `${label} ${i + 1}` : `Promo Account`,
        owner_email: `promo-${slug}@snapworxxpro.com`,
        subdomain,
        plan: "pro",
        plan_status: "active",
        events_limit: 10,
        storage_limit_gb: 10,
        emails_limit: 1000,
        active: true,
        is_promo: true,
        promo_claimed: false,
        promo_claim_token: token,
      })
      .select("id, subdomain, promo_claim_token")
      .single();

    if (error || !tenant) continue;

    await auditLog(admin.id, "create_promo_account", "wl_tenants", tenant.id, undefined, undefined, { subdomain: tenant.subdomain });
    created.push({ id: tenant.id, subdomain: tenant.subdomain, token: tenant.promo_claim_token });
  }

  if (created.length === 0) {
    return NextResponse.json({ error: "Failed to create promo accounts" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created });
}

// ── PATCH: revoke / restore / reset ──────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await request.json();
  const supabase = getServiceRoleClient();

  if (action === "revoke") {
    await supabase.from("wl_tenants").update({ active: false }).eq("id", id);
    // Invalidate all active sessions for this tenant
    await supabase.from("wl_owner_sessions").update({ active: false }).eq("tenant_id", id);
    await auditLog(admin.id, "revoke_promo_account", "wl_tenants", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    await supabase.from("wl_tenants").update({ active: true }).eq("id", id);
    await auditLog(admin.id, "restore_promo_account", "wl_tenants", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    const newToken = generateToken();
    const slug = `promo-reset-${Date.now().toString(36)}`;
    await supabase.from("wl_tenants").update({
      promo_claimed: false,
      promo_claimed_at: null,
      promo_claimed_by_email: null,
      promo_claim_token: newToken,
      name: "Promo Account",
      owner_email: `promo-${slug}@snapworxxpro.com`,
      active: true,
      plan_status: "active",
    }).eq("id", id);
    // Wipe old credentials and sessions
    await supabase.from("wl_tenant_owners").delete().eq("tenant_id", id);
    await supabase.from("wl_owner_sessions").update({ active: false }).eq("tenant_id", id);
    await auditLog(admin.id, "reset_promo_account", "wl_tenants", id);
    const { data } = await supabase.from("wl_tenants").select("promo_claim_token, subdomain").eq("id", id).single();
    return NextResponse.json({ ok: true, token: data?.promo_claim_token, subdomain: data?.subdomain });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
