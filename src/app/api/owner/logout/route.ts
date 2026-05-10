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

  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://snapworxxpro.com").hostname;
  const response = NextResponse.json({ ok: true });

  // Clear cookie on both root and subdomain
  response.cookies.set(OWNER_COOKIE, "", {
    maxAge: 0,
    path: "/",
    domain: `.${appHost}`,
  });
  response.cookies.set(OWNER_COOKIE, "", { maxAge: 0, path: "/" });

  return response;
}
