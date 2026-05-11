'use client';

import { EventData } from '@/lib/gallery-utils';
import { useMemo } from 'react';

function getInitials(name: string) {
  if (!name) return 'E';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export default function EventGalleryHeader({ event }: { event: EventData }) {
  const primaryColor = event.tenant_primary_color || '#9333ea';
  const headerInitials = useMemo(() => getInitials(event.tenant_name || event.name), [event.tenant_name, event.name]);
  const profileInitials = useMemo(() => getInitials(event.name), [event.name]);

  return (
    <div className="relative w-full">
      {event.header_image ? (
        <div className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.header_image} alt={`${event.name} header`} className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/10" />
        </div>
      ) : (
        <div
          className="relative w-full h-[180px] sm:h-[220px] lg:h-[260px] flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}99)` }}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
          <div className="relative z-10 text-center px-4">
            {event.tenant_logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.tenant_logo_url} alt={event.tenant_name || event.name} className="h-16 w-auto mx-auto mb-3 object-contain drop-shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
                {headerInitials}
              </div>
            )}
            <p className="text-white/90 text-sm sm:text-base font-light tracking-wide">every memory, every moment</p>
          </div>
        </div>
      )}

      <div className="relative -mt-[40px] sm:-mt-[50px] flex justify-center z-10">
        {event.profile_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.profile_image} alt={event.name} className="rounded-full border-4 border-white object-cover shadow-lg w-20 h-20 sm:w-24 sm:h-24 lg:w-[110px] lg:h-[110px]" loading="eager" />
        ) : (
          <div
            className="rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold w-20 h-20 sm:w-24 sm:h-24 lg:w-[110px] lg:h-[110px] text-xl sm:text-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            {profileInitials}
          </div>
        )}
      </div>

      <div className="pt-3 sm:pt-4 pb-6 text-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{event.name || 'Untitled Event'}</h1>
        {event.tenant_name && (
          <p className="text-sm text-gray-500 mt-1">Hosted by {event.tenant_name}</p>
        )}
      </div>
    </div>
  );
}
