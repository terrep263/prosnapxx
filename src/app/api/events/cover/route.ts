import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";

const schema = z.object({
  eventId: z.string().uuid(),
  photoPath: z.string().min(1)
});

export async function PATCH(request: NextRequest) {
  const tenant = await getTenant();
  const body = schema.parse(await request.json());
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase
    .from("events")
    .update({ cover_photo_path: body.photoPath })
    .eq("id", body.eventId)
    .eq("tenant_id", tenant.id)
    .select("id")
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
