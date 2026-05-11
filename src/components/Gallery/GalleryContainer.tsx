'use client';

import { useState, useEffect } from 'react';
import { GalleryItem, GalleryPermissions } from './types';
import { EventData, getPackageType, getViewMode, getGalleryPermissions } from '@/lib/gallery-utils';
import EventGalleryHeader from './EventGalleryHeader';
import GalleryControls, { GalleryLayout } from './GalleryControls';
import UploadModal from './UploadModal';
import GalleryContent from './GalleryContent';
import FullScreenLightbox from './FullScreenLightbox';

export default function GalleryContainer({ event, photos, allPhotos, loading = false, error = null, currentPage: extPage, totalPages: extTotal, onPageChange: extPageChange, isAdmin = false, isOwner = false }: {
  event: EventData;
  photos: GalleryItem[];
  allPhotos?: GalleryItem[];
  loading?: boolean;
  error?: string | null;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isAdmin?: boolean;
  isOwner?: boolean;
}) {
  const primaryColor = event.tenant_primary_color || '#9333ea';
  const [layout, setLayout] = useState<GalleryLayout>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snapworxx_gallery_layout') as GalleryLayout;
      if (['grid', 'masonry', 'list'].includes(saved)) return saved;
    }
    return 'grid';
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = extPage ?? internalPage;
  const totalPages = extTotal ?? Math.ceil(photos.length / 50);

  const packageType = getPackageType(event);
  const viewMode = getViewMode(event, null);
  const permissions = getGalleryPermissions(packageType, viewMode);

  const galleryItems: GalleryItem[] = photos.map(p => ({ ...p, url: p.url || p.storage_url || '', alt: p.alt || p.filename || event.name }));
  const lightboxItems: GalleryItem[] = (allPhotos || photos).map(p => ({ ...p, url: p.url || p.storage_url || '', alt: p.alt || p.filename || event.name }));

  const handleItemClick = (pageIdx: number) => {
    const clicked = galleryItems[pageIdx];
    if (!clicked) return;
    const fullIdx = lightboxItems.findIndex(i => i.id === clicked.id);
    setLightboxIndex(fullIdx >= 0 ? fullIdx : pageIdx);
    setLightboxOpen(true);
  };

  const handleDownload = async (item: GalleryItem) => {
    try {
      const res = await fetch('/api/download/single', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photoId: item.id, eventId: event.id }) });
      if (!res.ok) throw new Error('Download failed');
      const ct = res.headers.get('content-type');
      if (ct?.includes('application/json')) {
        const data = await res.json();
        if (data.success && data.data?.url) {
          const blob = await fetch(data.data.url).then(r => r.blob());
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = data.data.filename || 'photo.jpg';
          document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
        }
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = item.filename || 'photo.jpg';
        document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      }
    } catch (err) { alert('Download failed. Please try again.'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
        <p className="text-gray-600">Loading gallery...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-red-600">Error: {error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <EventGalleryHeader event={event} />
      <GalleryControls layout={layout} onLayoutChange={setLayout} onUploadClick={() => setUploadOpen(true)} sticky primaryColor={primaryColor} />
      <GalleryContent items={galleryItems} layout={layout} onItemClick={handleItemClick} loading={loading} currentPage={currentPage} totalPages={totalPages}
        onPageChange={p => { if (extPageChange) extPageChange(p); else setInternalPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      {lightboxOpen && (
        <FullScreenLightbox items={lightboxItems} index={lightboxIndex} open={lightboxOpen} onClose={() => setLightboxOpen(false)} onIndexChange={setLightboxIndex}
          event={event} onDownload={handleDownload} isAdmin={isAdmin} isOwner={isOwner}
          onModerate={async (item, action) => { await fetch(`/api/photos/${item.id}/moderate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); window.location.reload(); }} />
      )}
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} eventId={event.id} event={event} onUploadComplete={() => window.location.reload()} />
    </div>
  );
}
