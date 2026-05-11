'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => { if (slug) loadEvent(); }, [slug]);
  useEffect(() => { if (event?.id) loadPhotos(); }, [event?.id, currentPage]);
  useEffect(() => { if (event?.id && currentPage === 1) loadAllPhotos(); }, [event?.id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/by-slug/${slug}`);
      if (!res.ok) { setError('Event not found'); return; }
      const data = await res.json();
      const ev: EventData = {
        ...data.event,
        tenant_primary_color: tenant?.primary_color || '#9333ea',
        tenant_logo_url: tenant?.logo_url || null,
        tenant_name: tenant?.name || '',
      };
      setEvent(ev);
    } catch { setError('Failed to load event'); }
    finally { setLoading(false); }
  };

  const loadPhotos = async () => {
    if (!event?.id) return;
    try {
      const res = await fetch(`/api/events/${event.id}/gallery?page=${currentPage}&limit=50&includeUnapproved=true`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPhotos((data.data.photos || []).map((p: any) => ({
        id: p.id, url: p.storage_url || p.url || '', filename: p.filename || p.original_filename,
        alt: p.filename || event.name, isVideo: p.is_video || false,
        width: p.width, height: p.height, created_at: p.uploaded_at || p.created_at,
        storage_url: p.storage_url || p.url, thumbnail_url: p.thumbnail_url || p.storage_url || p.url, size: p.file_size || p.size,
      })));
      setTotalPages(data.data.pagination?.totalPages || 1);
    } catch {}
  };

  const loadAllPhotos = async () => {
    if (!event?.id) return;
    try {
      const res = await fetch(`/api/events/${event.id}/gallery?limit=1000&page=1&includeUnapproved=true`);
      const data = await res.json();
      if (!data.success) return;
      setAllPhotos((data.data.photos || []).map((p: any) => ({
        id: p.id, url: p.storage_url || p.url || '', filename: p.filename || p.original_filename,
        alt: p.filename || event?.name, isVideo: p.is_video || false,
        width: p.width, height: p.height, created_at: p.uploaded_at || p.created_at,
        storage_url: p.storage_url || p.url, thumbnail_url: p.thumbnail_url || p.storage_url || p.url, size: p.file_size || p.size,
      })));
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
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
