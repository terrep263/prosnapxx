import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";
import { z } from "zod";

const OWNER_COOKIE = "swp_owner_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { email, password } = body.data;
  const supabase = getServiceRoleClient();

  // Look up owner by email
  const { data: owner } = await supabase
    .from("wl_tenant_owners")
    .select("*, wl_tenants(*)")
    .eq("email", email.toLowerCase())
    .single();

  if (!owner) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const valid = await verifyPassword(password, owner.password_hash);
  if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  // Check tenant is active
  const tenant = owner.wl_tenants;
  if (!tenant?.active) return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });

  // Create session token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("wl_owner_sessions").insert({
    tenant_id: tenant.id,
    owner_email: email.toLowerCase(),
    token_hash: tokenHash,
    expires_at: expiresAt,
    active: true,
  });

  const response = NextResponse.json({ ok: true, tenantId: tenant.id });
  response.cookies.set(OWNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
