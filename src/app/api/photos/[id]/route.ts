import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";

const PHOTO_BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "event-photos";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant();
  const { id } = await params;
  const supabase = getServiceRoleClient();
  const { data: photo } = await supabase
    .from("photos")
    .select("*, events!inner(tenant_id)")
    .eq("id", id)
    .eq("events.tenant_id", tenant.id)
    .single();

  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const path = photo.storage_path ?? photo.file_path;
  if (path) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  }
  await supabase.from("photos").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
