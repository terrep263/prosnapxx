'use client';

import { useEffect } from 'react';

export type GalleryLayout = 'grid' | 'masonry' | 'list';

const LAYOUT_KEY = 'snapworxx_gallery_layout';

export default function GalleryControls({
  onUploadClick,
  layout,
  onLayoutChange,
  sticky = true,
  primaryColor = '#9333ea',
}: {
  onUploadClick: () => void;
  layout: GalleryLayout;
  onLayoutChange: (layout: GalleryLayout) => void;
  sticky?: boolean;
  primaryColor?: string;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(LAYOUT_KEY, layout);
  }, [layout]);

  const btnStyle = { backgroundColor: primaryColor };

  return (
    <div className={`bg-white border-b border-gray-200 shadow-sm ${sticky ? 'sticky top-0 z-20' : ''}`}>
      <div className="container mx-auto px-4 sm:px-5 lg:px-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-4">
          <button
            onClick={onUploadClick}
            className="w-full sm:w-auto px-5 py-3 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            style={btnStyle}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Photos & Videos
          </button>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {(['grid', 'masonry', 'list'] as GalleryLayout[]).map((l) => (
              <button
                key={l}
                onClick={() => onLayoutChange(l)}
                className={`px-3 py-2 rounded-md transition-all ${layout === l ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                style={layout === l ? { color: primaryColor } : {}}
                title={`${l} layout`}
              >
                {l === 'grid' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                )}
                {l === 'masonry' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM8 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1H9a1 1 0 01-1-1V4zM15 3a1 1 0 00-1 1v12a1 1 0 001 1h2a1 1 0 001-1V4a1 1 0 00-1-1h-2z" />
                  </svg>
                )}
                {l === 'list' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
