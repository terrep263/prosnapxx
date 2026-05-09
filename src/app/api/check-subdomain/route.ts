import { NextRequest, NextResponse } from "next/server";
import { sanitizeSubdomain, isValidSubdomain } from "@/lib/slug";
import { getServiceRoleClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const value = sanitizeSubdomain(request.nextUrl.searchParams.get("subdomain") ?? "");
  if (!isValidSubdomain(value)) {
    return NextResponse.json({ available: false });
  }

  const supabase = getServiceRoleClient();
  const { data } = await supabase.from("wl_tenants").select("id").eq("subdomain", value).maybeSingle();
  return NextResponse.json({ available: !data });
}
