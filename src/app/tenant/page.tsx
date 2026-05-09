import Link from "next/link";
import { Plus, Camera } from "lucide-react";
import { TenantHeader } from "@/components/TenantHeader";
import { TenantButton } from "@/components/TenantButton";
import { requireTenantOwner } from "@/lib/auth";
import { getTenant } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

export default async function TenantDashboardPage() {
  const tenant = await getTenant();
  await requireTenantOwner(tenant);
  const supabase = getServiceRoleClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, title, slug, created_at, photos(count)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const eventsLimit = tenant.events_limit === -1 ? "Unlimited" : tenant.events_limit;
  const eventsPercent = tenant.events_limit === -1 ? 0 : Math.min(100, Math.round((tenant.events_this_month / tenant.events_limit) * 100));
  const storagePercent = Math.min(100, Math.round((Number(tenant.storage_used_gb) / tenant.storage_limit_gb) * 100));

  const eventsRemaining = tenant.events_limit === -1 ? null : tenant.events_limit - tenant.events_this_month;
  const atLimit = eventsRemaining !== null && eventsRemaining <= 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <TenantHeader tenant={tenant} href="/tenant" showNav />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-semibold capitalize text-brand-primary">
              {tenant.plan} plan
            </span>
            <h1 className="mt-3 text-3xl font-bold text-gray-950">{tenant.name}</h1>
          </div>
          <TenantButton href="/create" disabled={atLimit}>
            <Plus className="mr-2 h-4 w-4" />
            New event
          </TenantButton>
        </div>

        {atLimit ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Monthly event limit reached.{" "}
            <Link href="/signup" className="underline">Upgrade your plan</Link> to create more events.
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Events this month</span>
              <span>{tenant.events_this_month} / {eventsLimit}</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-gray-100">
              <div
                className={`h-2.5 rounded-full transition-all ${eventsPercent >= 90 ? "bg-amber-500" : "bg-brand-primary"}`}
                style={{ width: `${eventsPercent}%` }}
              />
            </div>
            {eventsRemaining !== null && eventsRemaining <= 3 && eventsRemaining > 0 ? (
              <p className="mt-2 text-xs text-amber-600">{eventsRemaining} event{eventsRemaining === 1 ? "" : "s"} remaining this month.</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>Storage used</span>
              <span>{Number(tenant.storage_used_gb).toFixed(1)} GB / {tenant.storage_limit_gb} GB</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-gray-100">
              <div
                className={`h-2.5 rounded-full transition-all ${storagePercent >= 90 ? "bg-amber-500" : "bg-brand-secondary"}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-950">Events</h2>
            <span className="text-sm text-gray-500">{events?.length ?? 0} total</span>
          </div>
          <div className="divide-y divide-gray-100">
            {(events ?? []).map((event) => {
              const photoCount = Array.isArray(event.photos) ? (event.photos[0]?.count ?? 0) : 0;
              return (
                <Link
                  key={event.id}
                  href={`/dashboard/${event.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                      <Camera className="h-4 w-4 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-950 group-hover:text-brand-primary">
                        {String(event.name ?? event.title ?? "Untitled event")}
                      </p>
                      <p className="text-xs text-gray-400">{event.created_at ? formatDate(event.created_at) : ""}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {photoCount} photo{photoCount === 1 ? "" : "s"}
                  </span>
                </Link>
              );
            })}

            {!events?.length ? (
              <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  <Camera className="h-7 w-7 text-gray-400" />
                </div>
                <p className="font-medium text-gray-950">No events yet</p>
                <p className="text-sm text-gray-500">Create your first event gallery to get started.</p>
                <TenantButton href="/create" className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Create first event
                </TenantButton>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
