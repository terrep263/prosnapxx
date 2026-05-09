"use client";

import { createContext, useContext } from "react";
import type { WlTenant } from "@/lib/types";

const TenantContext = createContext<WlTenant | null>(null);

export function TenantProvider({ tenant, children }: { tenant: WlTenant | null; children: React.ReactNode }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const tenant = useContext(TenantContext);
  if (!tenant) {
    throw new Error("Tenant context is not available");
  }
  return tenant;
}
