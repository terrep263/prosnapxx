import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_audit_logs")
    .select("*, admin_users(name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
