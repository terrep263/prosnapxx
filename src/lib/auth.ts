import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";
import type { WlTenant } from "@/lib/types";

const OWNER_COOKIE = "swp_owner_token";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function getOwnerSession(tenant: WlTenant): Promise<{ email: string; tenantId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE)?.value;
  if (!token) return null;

  const supabase = getServiceRoleClient();
  const tokenHash = hashToken(token);

  const { data: session } = await supabase
    .from("wl_owner_sessions")
    .select("id, tenant_id, owner_email, expires_at")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .eq("tenant_id", tenant.id)
    .single();

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("wl_owner_sessions").update({ active: false }).eq("id", session.id);
    return null;
  }

  return { email: session.owner_email, tenantId: session.tenant_id };
}

export async function requireTenantOwner(tenant: WlTenant) {
  const ownerSession = await getOwnerSession(tenant);
  if (ownerSession) return ownerSession;
  redirect(`/login?next=${encodeURIComponent("/tenant")}`);
}
