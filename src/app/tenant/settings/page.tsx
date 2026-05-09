import { TenantHeader } from "@/components/TenantHeader";
import { TenantSettingsForm } from "@/components/TenantSettingsForm";
import { requireTenantOwner } from "@/lib/auth";
import { getTenant } from "@/lib/server-tenant";

export default async function TenantSettingsPage() {
  const tenant = await getTenant();
  await requireTenantOwner(tenant);

  return (
    <main className="min-h-screen bg-gray-50">
      <TenantHeader tenant={tenant} href="/tenant" showNav />
      <section className="px-4 py-10 sm:px-6">
        <TenantSettingsForm tenant={tenant} />
      </section>
    </main>
  );
}
