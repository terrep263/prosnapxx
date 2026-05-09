import { headers } from "next/headers";
import type { WlTenant } from "@/lib/types";

export async function getTenant(): Promise<WlTenant> {
  const headerStore = await headers();
  const rawTenant = headerStore.get("x-tenant-data");
  if (!rawTenant) {
    throw new Error("Tenant was not resolved for this request");
  }

  try {
    return JSON.parse(decodeURIComponent(rawTenant)) as WlTenant;
  } catch {
    throw new Error("Tenant header is invalid");
  }
}

export function getTenantAppUrl(tenant: WlTenant) {
  if (tenant.custom_domain) {
    return `https://${tenant.custom_domain}`;
  }
  if (tenant.subdomain) {
    return `https://${tenant.subdomain}.${new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://wl.snapworxx.com").hostname}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://wl.snapworxx.com";
}
