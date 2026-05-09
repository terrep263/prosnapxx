import { NextResponse } from "next/server";
import { destroyAdminSession, COOKIE_NAME } from "@/lib/admin-auth";

export async function POST() {
  await destroyAdminSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return response;
}
