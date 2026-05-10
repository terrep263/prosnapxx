import { CreateEventForm } from "@/components/CreateEventForm";
import { TenantHeader } from "@/components/TenantHeader";
import { requireTenantOwner } from "@/lib/auth";
import { getTenant } from "@/lib/server-tenant";

export default async function CreatePage() {
  const tenant = await getTenant();
  await requireTenantOwner(tenant);

  return (
    <main className="min-h-screen bg-gray-50">
      <TenantHeader tenant={tenant} showNav />
      <section className="px-4 py-10 sm:px-6">
        <CreateEventForm tenant={tenant} />
      </section>
    </main>
  );
}
