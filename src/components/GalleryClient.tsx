"use client";

import Image from "next/image";
import { Download, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { getPhotoPublicUrl } from "@/lib/supabase";
import { useTenant } from "@/lib/tenant";
import type { EventRecord, PhotoRecord } from "@/lib/types";
import { TenantButton } from "@/components/TenantButton";
import { useToast } from "@/components/Toast";

export function GalleryClient({ event, photos, tenantAppUrl }: { event: EventRecord; photos: PhotoRecord[]; tenantAppUrl: string }) {
  const tenant = useTenant();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(photos);
  const [active, setActive] = useState<PhotoRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const urls = useMemo(
    () =>
      items.map((photo) => ({
        photo,
        url: photo.public_url ?? photo.url ?? getPhotoPublicUrl(String(photo.storage_path ?? photo.file_path ?? ""), tenantAppUrl)
      })),
    [items, tenantAppUrl]
  );

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    form.set("eventId", event.id);

    const response = await fetch("/api/photos/upload", { method: "POST", body: form });
    setUploading(false);
    if (!response.ok) {
      toast("Upload failed. Please try again.", "error");
      return;
    }
    const payload = (await response.json()) as { photos: PhotoRecord[] };
    setItems((current) => [...payload.photos, ...current]);
    toast(`${payload.photos.length} photo${payload.photos.length === 1 ? "" : "s"} uploaded.`, "success");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {tenant.logo_url ? (
              <Image src={tenant.logo_url} alt={tenant.name} width={64} height={64} className="mb-4 h-16 w-16 rounded object-contain" />
            ) : null}
            <p className="text-sm font-medium text-brand-primary">{tenant.name}</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">{String(event.name ?? event.title ?? "Event gallery")}</h1>
          </div>
          <div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
            <TenantButton type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photos
                </>
              )}
            </TenantButton>
          </div>
        </div>

        <div
          className={`mt-8 rounded-xl border-2 border-dashed transition ${dragOver ? "border-brand-primary bg-brand-primary/5" : "border-transparent"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        >
          {dragOver ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm font-semibold text-brand-primary">Drop photos here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {urls.map(({ photo, url }) => (
                <button
                  key={photo.id}
                  type="button"
                  className="focus-ring group aspect-square overflow-hidden rounded-md bg-gray-200"
                  onClick={() => setActive(photo)}
                >
                  <Image src={url} alt="" width={500} height={500} className="h-full w-full object-cover transition group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </div>

        {!items.length && !dragOver ? (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Upload className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-gray-500">No photos yet. Upload your first photos or drag them here.</p>
          </div>
        ) : null}
      </section>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setActive(null)}>
            <X className="h-6 w-6" />
          </button>
          {(() => {
            const url = active.public_url ?? active.url ?? getPhotoPublicUrl(String(active.storage_path ?? active.file_path ?? ""), tenantAppUrl);
            return (
              <div className="flex max-h-full max-w-5xl flex-col items-center gap-4">
                <Image src={url} alt="" width={1400} height={1000} className="max-h-[80vh] w-auto rounded object-contain" />
                <a className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-950" href={url} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </div>
            );
          })()}
        </div>
      ) : null}
    </main>
  );
}
