import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

const PHOTO_BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "event-photos";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const filePath = path.map(decodeURIComponent).join("/");
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(filePath);
  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(data.stream(), {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
