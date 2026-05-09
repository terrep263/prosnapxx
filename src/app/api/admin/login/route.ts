import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceRoleClient } from "@/lib/supabase";
import { verifyPassword, createAdminSession, auditLog, COOKIE_NAME } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("*")
    .eq("email", body.email.toLowerCase())
    .eq("active", true)
    .single();

  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(body.password, admin.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const token = await createAdminSession(admin.id, ip, userAgent);

  await auditLog(admin.id, "admin_login", "admin_users", admin.id, undefined, undefined, { ip, userAgent });

  const response = NextResponse.json({ ok: true, role: admin.role });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/"
  });

  return response;
}
