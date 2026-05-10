import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, hashPassword, auditLog } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";
import { z } from "zod";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("admin_users")
    .select("id, email, name, role, active, last_login_at, created_at")
    .order("created_at");

  return NextResponse.json(data ?? []);
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = getServiceRoleClient();
  const { data: existing } = await supabase.from("admin_users").select("id").eq("role", "admin");
  if ((existing ?? []).length >= 3) {
    return NextResponse.json({ error: "Maximum of 3 admin slots already filled" }, { status: 400 });
  }

  const body = createSchema.parse(await request.json());
  const passwordHash = await hashPassword(body.password);

  const { data, error } = await supabase
    .from("admin_users")
    .insert({ email: body.email, name: body.name, password_hash: passwordHash, role: "admin", active: true, created_by: admin.id })
    .select("id, email, name, role, active, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await auditLog(admin.id, "create_admin_user", "admin_users", data.id, undefined, { email: data.email, role: data.role });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, active } = await request.json();
  if (id === admin.id) return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });

  const supabase = getServiceRoleClient();
  await supabase.from("admin_users").update({ active }).eq("id", id);
  await auditLog(admin.id, active ? "activate_admin" : "deactivate_admin", "admin_users", id);
  return NextResponse.json({ ok: true });
}
