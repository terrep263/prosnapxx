import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, auditLog } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data } = await supabase.from("system_settings").select("*");
  return NextResponse.json(data ?? []);
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, value } = await request.json();
  const supabase = getServiceRoleClient();

  const { data: before } = await supabase.from("system_settings").select("value").eq("key", key).single();
  await supabase.from("system_settings").upsert({ key, value, updated_at: new Date().toISOString(), updated_by: session.admin.id });
  await auditLog(session.admin.id, "update_system_setting", "system_settings", key, { value: before?.value }, { value });

  return NextResponse.json({ ok: true });
}
