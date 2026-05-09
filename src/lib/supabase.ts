import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function createPublicClient() {
  return createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { persistSession: false }
  });
}

export function getServiceRoleClient() {
  return createClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function getPhotoPublicUrl(filePath: string, tenantAppUrl: string) {
  const normalizedBase = tenantAppUrl.replace(/\/$/, "");
  const normalizedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return `${normalizedBase}/api/img/${normalizedPath}`;
}
