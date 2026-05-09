import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/DashboardClient";
import { TenantHeader } from "@/components/TenantHeader";
import { getServiceRoleClient } from "@/lib/supabase";
import { getTenant, getTenantAppUrl } from "@/lib/server-tenant";
import type { EventRecord, PhotoRecord } from "@/lib/types";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant();
  const { id } = await params;
  const supabase = getServiceRoleClient();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).eq("tenant_id", tenant.id).single<EventRecord>();
  if (!event) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .returns<PhotoRecord[]>();

  const appUrl = getTenantAppUrl(tenant);
  const galleryUrl = `${appUrl}/e/${event.slug}/gallery`;

  return (
    <>
      <TenantHeader tenant={tenant} href="/tenant" showNav />
      <DashboardClient event={event} photos={photos ?? []} galleryUrl={galleryUrl} tenantAppUrl={appUrl} />
    </>
  );
}
