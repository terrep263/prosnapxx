'use client';

import { useState, useMemo, useEffect } from 'react';
import { GalleryItem } from './types';
import { GalleryLayout } from './GalleryControls';

const ITEMS_PER_PAGE = 50;

function formatDate(d?: string) {
  if (!d) return '';
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`;
  return date.toLocaleDateString();
}

function formatSize(b?: number) {
  if (!b) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function ImgWithFallback({ src, fallback, alt, className }: { src: string; fallback?: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  const [cur, setCur] = useState(src);
  const handleError = () => {
    if (!err && fallback && fallback !== cur) { setCur(fallback); } else { setErr(true); }
  };
  if (err) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    </div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={cur} alt={alt} className={className} loading="lazy" onError={handleError} />;
}

function GalleryCard({ item, index, onClick, aspect }: { item: GalleryItem; index: number; onClick: (i: number) => void; aspect: 'square' | 'preserve' }) {
  const [err, setErr] = useState(false);
  const [src, setSrc] = useState(item.thumbnail_url || item.url);
  const handleErr = () => {
    if (src === item.thumbnail_url && item.url && item.url !== item.thumbnail_url) { setSrc(item.url); setErr(false); } else { setErr(true); }
  };
  const style = aspect === 'square' ? { aspectRatio: '1/1', width: '100%' } : { width: '100%' };
  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer group hover:opacity-90 transition-opacity" style={style} onClick={() => onClick(index)}>
      {item.isVideo ? (
        <>
          <video src={item.url} poster={item.thumbnail_url && item.thumbnail_url !== item.url ? item.thumbnail_url : undefined}
            className={aspect === 'square' ? 'w-full h-full object-cover' : 'w-full h-auto'} preload="metadata" muted playsInline
            onLoadedMetadata={(e) => { const v = e.currentTarget; if (v.duration > 1) v.currentTime = Math.min(1, v.duration * 0.1); }} />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30">
            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
            </div>
          </div>
        </>
      ) : err ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={item.alt || item.filename || 'Photo'} className={aspect === 'square' ? 'w-full h-full object-cover' : 'w-full h-auto'} loading="lazy" onError={handleErr} />
      )}
    </div>
  );
}

export default function GalleryContent({ items, layout, onItemClick, loading = false, currentPage = 1, totalPages = 1, onPageChange }: {
  items: GalleryItem[];
  layout: GalleryLayout;
  onItemClick: (index: number) => void;
  loading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}) {
  useEffect(() => { console.log('Gallery layout:', layout); }, [layout]);
  const paged = useMemo(() => items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [items, currentPage]);

  if (loading) return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />)}
    </div>
  );

  if (!items.length) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-gray-500 text-lg">No photos yet. Be the first to upload!</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {layout === 'list' ? (
        <div className="max-w-5xl mx-auto space-y-4">
          {paged.map((item, i) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md cursor-pointer flex gap-4 p-4" onClick={() => onItemClick(i)}>
              <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                {item.isVideo ? (
                  <video src={item.url} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                ) : (
                  <ImgWithFallback src={item.thumbnail_url || item.url} fallback={item.url} alt={item.filename || 'Photo'} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.filename || 'Untitled'}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at)}{item.size ? ` • ${formatSize(item.size)}` : ''}{item.isVideo ? ' • Video' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      ) : layout === 'masonry' ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
          {paged.map((item, i) => (
            <div key={item.id} className="break-inside-avoid mb-3">
              <GalleryCard item={item} index={i} onClick={onItemClick} aspect="preserve" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
          {paged.map((item, i) => (
            <div key={item.id} className="aspect-square w-full">
              <GalleryCard item={item} index={i} onClick={onItemClick} aspect="square" />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-2 mt-8 pb-8">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Previous</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p = i + 1;
            if (totalPages > 7) {
              if (currentPage <= 4) p = i + 1;
              else if (currentPage >= totalPages - 3) p = totalPages - 6 + i;
              else p = currentPage - 3 + i;
            }
            return (
              <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === p ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>
            );
          })}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
