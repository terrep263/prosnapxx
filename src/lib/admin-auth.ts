import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";

const COOKIE_NAME = "swp_admin";
const SECRET = process.env.ADMIN_JWT_SECRET ?? "fallback-secret-change-me";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin";
};

// ── Simple HMAC token: base64(payload).base64(sig) ──────────────────────────

function sign(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verify(token: string): AdminUser | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return { id: payload.id, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function createAdminSession(admin: AdminUser): Promise<string> {
  return sign({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  });
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  return admin!;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "superadmin") redirect("/admin");
  return admin;
}

export async function auditLog(
  adminId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  beforeState?: object,
  afterState?: object,
  metadata?: object
): Promise<void> {
  const supabase = getServiceRoleClient();
  await supabase.from("admin_audit_logs").insert({
    admin_user_id: adminId,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    before_state: beforeState ?? null,
    after_state: afterState ?? null,
    metadata: metadata ?? {},
  });
}

export { COOKIE_NAME };
