'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import GalleryContainer from '@/components/Gallery/GalleryContainer';
import { EventData } from '@/lib/gallery-utils';
import { GalleryItem } from '@/components/Gallery/types';
import { useTenant } from '@/lib/tenant';

export default function EventGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const tenant = useTenant();

  const [event, setEvent] = useState<EventData | null>(null);
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [allPhotos, setAllPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/by-slug/${slug}`);
      if (!res.ok) { setError('Event not found'); return; }
      const data = await res.json() as { event: Record<string, unknown> };
      const ev: EventData = {
        id: data.event.id as string,
        name: (data.event.name || data.event.title || '') as string,
        slug: data.event.slug as string,
        owner_email: data.event.owner_email as string | null,
        header_image: data.event.header_image as string | null,
        profile_image: data.event.profile_image as string | null,
        tenant_primary_color: tenant?.primary_color || '#9333ea',
        tenant_logo_url: tenant?.logo_url || null,
        tenant_name: tenant?.name || '',
      };
      setEvent(ev);
    } catch {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [slug, tenant]);

  const loadPhotos = useCallback(async (ev: EventData, page: number) => {
    if (!ev?.id) return;
    try {
      const res = await fetch(`/api/events/${ev.id}/gallery?page=${page}&limit=50&includeUnapproved=true`);
      const data = await res.json() as { success: boolean; data: { photos: Record<string, unknown>[]; pagination: { totalPages: number } } };
      if (!data.success) return;
      setPhotos((data.data.photos || []).map((p) => ({
        id: p.id as string,
        url: (p.storage_url || p.url || '') as string,
        filename: (p.filename || p.original_filename) as string | undefined,
        alt: (p.filename as string) || ev.name,
        isVideo: (p.is_video || false) as boolean,
        width: p.width as number | undefined,
        height: p.height as number | undefined,
        created_at: (p.uploaded_at || p.created_at) as string | undefined,
        storage_url: (p.storage_url || p.url) as string | undefined,
        thumbnail_url: (p.thumbnail_url || p.storage_url || p.url) as string | undefined,
        size: (p.file_size || p.size) as number | undefined,
      })));
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch { /* silently fail */ }
  }, []);

  const loadAllPhotos = useCallback(async (ev: EventData) => {
    if (!ev?.id) return;
    try {
      const res = await fetch(`/api/events/${ev.id}/gallery?limit=1000&page=1&includeUnapproved=true`);
      const data = await res.json() as { success: boolean; data: { photos: Record<string, unknown>[] } };
      if (!data.success) return;
      setAllPhotos((data.data.photos || []).map((p) => ({
        id: p.id as string,
        url: (p.storage_url || p.url || '') as string,
        filename: (p.filename || p.original_filename) as string | undefined,
        alt: (p.filename as string) || ev.name,
        isVideo: (p.is_video || false) as boolean,
        width: p.width as number | undefined,
        height: p.height as number | undefined,
        created_at: (p.uploaded_at || p.created_at) as string | undefined,
        storage_url: (p.storage_url || p.url) as string | undefined,
        thumbnail_url: (p.thumbnail_url || p.storage_url || p.url) as string | undefined,
        size: (p.file_size || p.size) as number | undefined,
      })));
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => { if (slug) loadEvent(); }, [slug, loadEvent]);

  useEffect(() => {
    if (event?.id) {
      loadPhotos(event, currentPage);
      if (currentPage === 1) loadAllPhotos(event);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, currentPage]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading gallery...</p>
      </div>
    </div>
  );

  if (error || !event) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-600">{error || 'Event not found'}</p>
    </div>
  );

  return (
    <GalleryContainer
      event={event}
      photos={photos}
      allPhotos={allPhotos.length > 0 ? allPhotos : photos}
      loading={false}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}
