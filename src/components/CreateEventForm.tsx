"use client";

import { useState } from "react";
import { TenantButton } from "@/components/TenantButton";
import { useToast } from "@/components/Toast";
import type { WlTenant } from "@/lib/types";

export function CreateEventForm({ tenant }: { tenant: WlTenant }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState(tenant.owner_email);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ownerEmail })
    });
    setLoading(false);

    if (response.status === 403) {
      toast("Monthly event limit reached. Please upgrade your plan.", "error");
      return;
    }

    if (!response.ok) {
      toast("Event could not be created. Please try again.", "error");
      return;
    }

    const payload = (await response.json()) as { url?: string; dashboardUrl?: string };
    if (payload.url) window.location.href = payload.url;
    if (payload.dashboardUrl) window.location.href = payload.dashboardUrl;
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-950">Create your event</h1>
      <p className="mt-2 text-sm text-gray-600">
        {tenant.events_limit === -1 ? "Unlimited events available." : `${Math.max(tenant.events_limit - tenant.events_this_month, 0)} events remaining this month.`}
      </p>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Event name
          <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Owner email
          <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} required />
        </label>
      </div>
      <TenantButton className="mt-6 w-full" disabled={loading || !name || !ownerEmail}>
        {loading ? "Creating" : "Create Event"}
      </TenantButton>
    </form>
  );
}
