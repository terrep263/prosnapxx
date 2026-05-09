import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTenantOwner } from "@/lib/auth";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";

const schema = z.object({
  name: z.string().min(2).max(120),
  logo_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  custom_domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/).nullable().optional()
});

export async function PATCH(request: NextRequest) {
  const tenant = await getTenant();
  await requireTenantOwner(tenant);
  const body = schema.parse(await request.json());
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase.from("wl_tenants").update(body).eq("id", tenant.id).select("*").single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ tenant: data });
}
