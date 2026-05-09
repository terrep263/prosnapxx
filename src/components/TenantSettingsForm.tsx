"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { TenantButton } from "@/components/TenantButton";
import type { WlTenant } from "@/lib/types";

export function TenantSettingsForm({ tenant }: { tenant: WlTenant }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(tenant.name);
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? "");
  const [primaryColor, setPrimaryColor] = useState(tenant.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(tenant.secondary_color);
  const [customDomain, setCustomDomain] = useState(tenant.custom_domain ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadLogo(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/tenant/logo", { method: "POST", body: form });
    if (response.ok) {
      const payload = (await response.json()) as { logo_url: string };
      setLogoUrl(payload.logo_url);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/tenant/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, logo_url: logoUrl || null, primary_color: primaryColor, secondary_color: secondaryColor, custom_domain: customDomain || null })
    });
    setSaving(false);
    setMessage(response.ok ? "Settings saved." : "Settings could not be saved.");
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-950">Account settings</h1>
      <div className="mt-6 grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Business name
          <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="grid gap-2 text-sm font-medium text-gray-700">
          Logo
          <div className="flex gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => uploadLogo(event.target.files)} />
            <input className="focus-ring min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
            <TenantButton type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TenantButton>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Primary color
            <input className="h-11 rounded-md border border-gray-300 p-1" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-medium text-gray-700">
            Secondary color
            <input className="h-11 rounded-md border border-gray-300 p-1" type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Custom domain
          <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" value={customDomain} onChange={(event) => setCustomDomain(event.target.value.toLowerCase().trim())} placeholder="photos.yourdomain.com" />
          <span className="text-gray-500">Add a CNAME record for this hostname pointing to wl.snapworxx.com, then save the domain here.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Subdomain
          <input className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500" value={tenant.subdomain ?? ""} readOnly />
        </label>
      </div>
      {message ? <p className="mt-4 text-sm text-gray-600">{message}</p> : null}
      <TenantButton className="mt-6" disabled={saving}>{saving ? "Saving" : "Save settings"}</TenantButton>
    </form>
  );
}
