import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";

const PHOTO_BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "event-photos";

export async function POST(request: NextRequest) {
  const tenant = await getTenant();

  // Hard gate: block uploads if storage is full
  const storageTotal = Number(tenant.storage_limit_gb) + Number((tenant as any).storage_add_on_gb ?? 0);
  const storageUsed = Number(tenant.storage_used_gb);
  if (storageUsed >= storageTotal) {
    return NextResponse.json({ error: "Storage limit reached. Please upgrade your plan." }, { status: 403 });
  }
  const form = await request.formData();
  const eventId = String(form.get("eventId") ?? "");
  const files = form.getAll("files").filter((file): file is File => file instanceof File && file.type.startsWith("image/"));
  if (!eventId || !files.length) {
    return NextResponse.json({ error: "Missing event or files" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data: event } = await supabase.from("events").select("id").eq("id", eventId).eq("tenant_id", tenant.id).single();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const inserted = [];
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${tenant.id}/${eventId}/${crypto.randomUUID()}.${extension}`;
    const upload = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 400 });
    }
    const { data: photo, error } = await supabase
      .from("photos")
      .insert({ event_id: eventId, storage_path: path, file_path: path })
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    inserted.push(photo);
  }

  return NextResponse.json({ photos: inserted });
}
