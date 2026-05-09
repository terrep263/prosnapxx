import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { WlTenant } from "@/lib/types";

export async function requireTenantOwner(tenant: WlTenant) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();

  if (error || !email || email !== tenant.owner_email.toLowerCase()) {
    redirect(`/login?next=${encodeURIComponent("/tenant")}`);
  }

  return data.user;
}
