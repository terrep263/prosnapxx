import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";
import { getPhotoPublicUrl } from "@/lib/supabase";
import { getTenantAppUrl } from "@/lib/server-tenant";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant();
  const { id } = await params;
  const supabase = getServiceRoleClient();
  const { data: event } = await supabase.from("events").select("id").eq("id", id).eq("tenant_id", tenant.id).single();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: photos } = await supabase.from("photos").select("storage_path, file_path, url, public_url").eq("event_id", id);
  const appUrl = getTenantAppUrl(tenant);
  const lines = (photos ?? []).map((photo) => photo.public_url ?? photo.url ?? getPhotoPublicUrl(String(photo.storage_path ?? photo.file_path), appUrl));

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${id}-photos.txt"`
    }
  });
}
