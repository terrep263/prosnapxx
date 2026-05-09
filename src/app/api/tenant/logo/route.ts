import { NextRequest, NextResponse } from "next/server";
import { requireTenantOwner } from "@/lib/auth";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const tenant = await getTenant();
  await requireTenantOwner(tenant);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${tenant.id}/logo-${Date.now()}.${extension}`;
  const supabase = getServiceRoleClient();
  const { error } = await supabase.storage.from("wl-assets").upload(path, file, { contentType: file.type, upsert: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const { data } = supabase.storage.from("wl-assets").getPublicUrl(path);
  return NextResponse.json({ logo_url: data.publicUrl });
}
