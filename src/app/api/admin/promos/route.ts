import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, auditLog } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("wl_tenants")
    .select("id, name, subdomain, active, promo_claimed, promo_claimed_at, promo_claimed_by_email, promo_claim_token, plan_status")
    .eq("is_promo", true)
    .order("subdomain");

  return NextResponse.json(data ?? []);
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, action } = await request.json();
  const supabase = getServiceRoleClient();

  if (action === "revoke") {
    await supabase.from("wl_tenants").update({ active: false }).eq("id", id);
    await auditLog(session.admin.id, "revoke_promo_account", "wl_tenants", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "restore") {
    await supabase.from("wl_tenants").update({ active: true }).eq("id", id);
    await auditLog(session.admin.id, "restore_promo_account", "wl_tenants", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset") {
    // Reset the claim so the link can be reused or reassigned
    const crypto = await import("crypto");
    const newToken = crypto.randomBytes(24).toString("hex");
    await supabase.from("wl_tenants").update({
      promo_claimed: false,
      promo_claimed_at: null,
      promo_claimed_by_email: null,
      promo_claim_token: newToken,
      name: `Promo Account ${id.slice(0, 4)}`,
      owner_email: `reset+${Date.now()}@snapworxxpro.com`,
      active: true,
      plan_status: "trialing",
    }).eq("id", id);
    await auditLog(session.admin.id, "reset_promo_account", "wl_tenants", id);
    const { data } = await supabase.from("wl_tenants").select("promo_claim_token").eq("id", id).single();
    return NextResponse.json({ ok: true, token: data?.promo_claim_token });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
