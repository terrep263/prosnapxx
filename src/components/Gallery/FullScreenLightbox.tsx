'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GalleryItem } from './types';
import { EventData } from '@/lib/gallery-utils';

export default function FullScreenLightbox({ items, index, open, onClose, onIndexChange, event, onDownload, isAdmin, isOwner, onModerate }: {
  items: GalleryItem[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (i: number) => void;
  event?: EventData;
  onDownload?: (item: GalleryItem, event?: EventData) => void;
  onShare?: (item: GalleryItem, event?: EventData) => void;
  onFavorite?: (item: GalleryItem, favorited: boolean) => void;
  isAdmin?: boolean;
  isOwner?: boolean;
  onModerate?: (item: GalleryItem, action: string) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = items[index];
  const isVideo = current?.isVideo;

  useEffect(() => {
    if (open && current) { setImageLoaded(false); }
  }, [open, current]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && index < items.length - 1) onIndexChange(index + 1);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, index, items.length, onClose, onIndexChange]);

  useEffect(() => {
    if (open) {
      const y = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${y}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, y);
      };
    }
  }, [open]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0 && index < items.length - 1) onIndexChange(index + 1);
      else if (dx < 0 && index > 0) onIndexChange(index - 1);
    }
  }, [index, items.length, onIndexChange]);

  const handleShare = useCallback(() => {
    if (!current) return;
    const url = event?.slug && current?.id
      ? `${window.location.origin}/e/${event.slug}/photo/${current.id}`
      : window.location.href;
    if (navigator.share) {
      navigator.share({ title: event?.name || 'Photo', url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
    }
  }, [current, event]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-white hover:text-gray-300 rounded-lg hover:bg-white/10">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-black/60 rounded-full px-4 py-1 text-white text-sm">{index + 1} / {items.length}</div>

      {index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white rounded-lg hover:bg-white/10">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}

      {index < items.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-3 text-white rounded-lg hover:bg-white/10">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}

      <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video ref={videoRef} src={current.url} controls autoPlay playsInline poster={current.thumbnail_url || undefined} className="max-w-full max-h-[95vh] rounded-lg" />
        ) : (
          <div className="relative">
            {!imageLoaded && current.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-50 scale-110" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt={current.alt || current.filename || 'Photo'} className={`max-w-full max-h-[95vh] object-contain rounded-lg transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setImageLoaded(true)} loading="eager" />
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
        {onDownload && (
          <button onClick={(e) => { e.stopPropagation(); onDownload(current, event); }} className="p-2 text-white hover:text-gray-300 rounded-lg hover:bg-white/10" title="Download">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="p-2 text-white hover:text-gray-300 rounded-lg hover:bg-white/10" title="Share">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowMeta(!showMeta); }} className={`p-2 rounded-lg hover:bg-white/10 ${showMeta ? 'text-yellow-400' : 'text-white hover:text-gray-300'}`} title="Info">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
        {(isAdmin || isOwner) && onModerate && (
          <>
            <div className="w-px h-6 bg-white/30 mx-1" />
            <button onClick={(e) => { e.stopPropagation(); if (confirm('Hide this photo?')) onModerate(current, 'hide'); }} className="p-2 text-white hover:text-orange-300 rounded-lg hover:bg-white/10" title="Hide">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </button>
          </>
        )}
      </div>

      {showMeta && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-md rounded-lg px-4 py-3 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-white text-sm font-semibold truncate mb-1">{current.filename || 'Photo'}</p>
          {current.created_at && <p className="text-white/70 text-xs">{new Date(current.created_at).toLocaleString()}</p>}
          {current.size && <p className="text-white/70 text-xs">{(current.size / 1048576).toFixed(1)} MB</p>}
        </div>
      )}
    </div>
  );
}
