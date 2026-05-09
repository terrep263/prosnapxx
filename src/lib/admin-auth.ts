import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServiceRoleClient } from "@/lib/supabase";
import crypto from "crypto";

const COOKIE_NAME = "swp_admin_token";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours max
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin";
  active: boolean;
};

export type AdminSession = {
  id: string;
  admin_user_id: string;
  token_hash: string;
  expires_at: string;
  last_activity_at: string;
  active: boolean;
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(derived, "hex"), Buffer.from(hash, "hex"));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function createAdminSession(adminUserId: string, ip?: string, userAgent?: string): Promise<string> {
  const supabase = getServiceRoleClient();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await supabase.from("admin_sessions").insert({
    admin_user_id: adminUserId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    last_activity_at: new Date().toISOString(),
    ip_address: ip ?? null,
    user_agent: userAgent ?? null,
    active: true
  });

  // Update last login
  await supabase.from("admin_users").update({ last_login_at: new Date().toISOString() }).eq("id", adminUserId);

  return token;
}

export async function getAdminSession(): Promise<{ admin: AdminUser; sessionId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const supabase = getServiceRoleClient();
  const tokenHash = hashToken(token);

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("*, admin_users(*)")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .single();

  if (!session) return null;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("admin_sessions").update({ active: false }).eq("id", session.id);
    return null;
  }

  // Check inactivity timeout
  const lastActivity = new Date(session.last_activity_at).getTime();
  if (Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
    await supabase.from("admin_sessions").update({ active: false }).eq("id", session.id);
    return null;
  }

  // Refresh activity
  await supabase.from("admin_sessions").update({ last_activity_at: new Date().toISOString() }).eq("id", session.id);

  const admin = session.admin_users as AdminUser;
  if (!admin?.active) return null;

  return { admin, sessionId: session.id };
}

export async function requireAdmin(): Promise<{ admin: AdminUser; sessionId: string }> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireSuperAdmin(): Promise<{ admin: AdminUser; sessionId: string }> {
  const session = await requireAdmin();
  if (session.admin.role !== "superadmin") redirect("/admin");
  return session;
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  const supabase = getServiceRoleClient();
  const tokenHash = hashToken(token);
  await supabase.from("admin_sessions").update({ active: false }).eq("token_hash", tokenHash);
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
    metadata: metadata ?? {}
  });
}

export { COOKIE_NAME };
