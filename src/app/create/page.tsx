import { CreateEventForm } from "@/components/CreateEventForm";
import { TenantHeader } from "@/components/TenantHeader";
import { getTenant } from "@/lib/server-tenant";

export default async function CreatePage() {
  const tenant = await getTenant();

  return (
    <main className="min-h-screen bg-gray-50">
      <TenantHeader tenant={tenant} />
      <section className="px-4 py-10 sm:px-6">
        <CreateEventForm tenant={tenant} />
      </section>
    </main>
  );
}
