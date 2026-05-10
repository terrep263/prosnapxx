import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";

const OWNER_COOKIE = "swp_owner_token";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(OWNER_COOKIE)?.value;

  if (token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const supabase = getServiceRoleClient();
    await supabase.from("wl_owner_sessions").update({ active: false }).eq("token_hash", tokenHash);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
