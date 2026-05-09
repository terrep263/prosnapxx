"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { Copy, Download, Image as ImageIcon, Trash2, X, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getPhotoPublicUrl } from "@/lib/supabase";
import type { EventRecord, PhotoRecord } from "@/lib/types";
import { TenantButton } from "@/components/TenantButton";
import { useToast } from "@/components/Toast";

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({ event, photos, galleryUrl, tenantAppUrl }: { event: EventRecord; photos: PhotoRecord[]; galleryUrl: string; tenantAppUrl: string }) {
  const toast = useToast();
  const [qr, setQr] = useState("");
  const [items, setItems] = useState(photos);
  const [confirmDelete, setConfirmDelete] = useState<PhotoRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [active, setActive] = useState<PhotoRecord | null>(null);

  useEffect(() => {
    QRCode.toDataURL(galleryUrl, { margin: 1, width: 320 }).then(setQr);
  }, [galleryUrl]);

  const urls = useMemo(
    () =>
      items.map((photo) => ({
        photo,
        url: photo.public_url ?? photo.url ?? getPhotoPublicUrl(String(photo.storage_path ?? photo.file_path ?? ""), tenantAppUrl)
      })),
    [items, tenantAppUrl]
  );

  async function deletePhoto(photo: PhotoRecord) {
    setDeleting(photo.id);
    const response = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
    setDeleting(null);
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== photo.id));
      toast("Photo deleted.", "success");
    } else {
      toast("Could not delete photo. Please try again.", "error");
    }
    setConfirmDelete(null);
  }

  async function makeCover(photo: PhotoRecord) {
    const response = await fetch("/api/events/cover", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, photoPath: photo.storage_path ?? photo.file_path ?? photo.url })
    });
    if (response.ok) {
      toast("Cover photo updated.", "success");
    } else {
      toast("Could not update cover photo.", "error");
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(galleryUrl);
    toast("Gallery link copied to clipboard.", "success");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-gray-200 bg-white p-5">
          <h1 className="text-2xl font-bold text-gray-950">{String(event.name ?? event.title ?? "Event dashboard")}</h1>
          <p className="mt-2 break-all text-sm text-gray-500">{galleryUrl}</p>
          {qr ? <Image src={qr} alt="Event QR code" width={280} height={280} className="mt-5 w-full rounded-md border border-gray-200" /> : (
            <div className="mt-5 aspect-square w-full animate-pulse rounded-md bg-gray-100" />
          )}
          <div className="mt-5 grid gap-3">
            <TenantButton type="button" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy share link
            </TenantButton>
            <TenantButton variant="secondary" href={`/api/events/${event.id}/download`}>
              <Download className="mr-2 h-4 w-4" />
              Bulk download
            </TenantButton>
          </div>
        </aside>

        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">Photos</h2>
              <p className="text-sm text-gray-500">{items.length} uploaded</p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <ImageIcon className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No photos yet. Share the gallery link for guests to start uploading.</p>
              <TenantButton variant="secondary" type="button" onClick={copyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy gallery link
              </TenantButton>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {urls.map(({ photo, url }) => (
                <article key={photo.id} className="overflow-hidden rounded-md border border-gray-200">
                  <button type="button" className="block w-full" onClick={() => setActive(photo)}>
                    <Image src={url} alt="" width={500} height={500} className="aspect-square w-full object-cover hover:opacity-90 transition" />
                  </button>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <button className="rounded p-2 text-gray-600 hover:bg-gray-100" title="Set as cover photo" onClick={() => makeCover(photo)}>
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                      title="Delete photo"
                      disabled={deleting === photo.id}
                      onClick={() => setConfirmDelete(photo)}
                    >
                      {deleting === photo.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500 inline-block" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {confirmDelete ? (
        <ConfirmModal
          message="Delete this photo permanently? This cannot be undone."
          onConfirm={() => deletePhoto(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      ) : null}

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
    </div>
  );
}
