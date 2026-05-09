import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, auditLog } from "@/lib/admin-auth";
import { getServiceRoleClient } from "@/lib/supabase";
import { z } from "zod";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("wl_tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

const updateSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  plan: z.enum(["starter", "pro", "studio", "agency"]).optional(),
  internal_notes: z.string().optional(),
  flagged: z.boolean().optional(),
  events_limit: z.number().optional(),
  storage_limit_gb: z.number().optional(),
  emails_limit: z.number().optional(),
  events_this_month: z.number().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = updateSchema.parse(await request.json());
  const { id, ...updates } = body;

  const supabase = getServiceRoleClient();
  const { data: before } = await supabase.from("wl_tenants").select("*").eq("id", id).single();
  const { data, error } = await supabase.from("wl_tenants").update(updates).eq("id", id).select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(session.admin.id, "update_tenant", "wl_tenants", id, before ?? undefined, data ?? undefined);
  return NextResponse.json(data);
}
