import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, auditLog } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";
import { sendTenantWelcomeEmail } from "@/lib/email";
import type { WlTenant } from "@/lib/types";

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId } = await request.json();
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = getServiceRoleClient();
  const { data: tenant } = await supabase.from("wl_tenants").select("*").eq("id", tenantId).single<WlTenant>();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  await sendTenantWelcomeEmail(tenant);
  await auditLog(admin.id, "resend_welcome_email", "wl_tenants", tenantId);

  return NextResponse.json({ ok: true });
}
