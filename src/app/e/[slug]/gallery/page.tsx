import { notFound } from "next/navigation";
import { GalleryClient } from "@/components/GalleryClient";
import { getServiceRoleClient } from "@/lib/supabase";
import { getTenant, getTenantAppUrl } from "@/lib/server-tenant";
import type { EventRecord, PhotoRecord } from "@/lib/types";

export default async function EventGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const tenant = await getTenant();
  const { slug } = await params;
  const supabase = getServiceRoleClient();

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).eq("tenant_id", tenant.id).single<EventRecord>();
  if (!event) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .returns<PhotoRecord[]>();

  return <GalleryClient event={event} photos={photos ?? []} tenantAppUrl={getTenantAppUrl(tenant)} />;
}
