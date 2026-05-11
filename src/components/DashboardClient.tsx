'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera, QrCode, Loader2, Share2, Upload, Eye, Download,
  Image as ImageIcon, Settings, Lock, Copy, Check, Trash2, AlertTriangle
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import type { EventRecord, PhotoRecord } from '@/lib/types';
import { useTenant } from '@/lib/tenant';
import { getPhotoPublicUrl } from '@/lib/supabase';

// ─── Helpers ───────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DashboardClient({
  event: initialEvent,
  photos: initialPhotos,
  galleryUrl,
  tenantAppUrl,
}: {
  event: EventRecord;
  photos: PhotoRecord[];
  galleryUrl: string;
  tenantAppUrl: string;
}) {
  const tenant = useTenant();
  const primaryColor = tenant?.primary_color || '#9333ea';

  // State
  const [event, setEvent] = useState(initialEvent);
  const [items, setItems] = useState(initialPhotos);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [eventName, setEventName] = useState(String(initialEvent.name ?? initialEvent.title ?? ''));
  const [headerImage, setHeaderImage] = useState<string | null>((initialEvent.header_image as string) || null);
  const [profileImage, setProfileImage] = useState<string | null>((initialEvent.profile_image as string) || null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>((initialEvent.cover_photo_url as string) || null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<PhotoRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [active, setActive] = useState<PhotoRecord | null>(null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [activeSection, setActiveSection] = useState<'overview' | 'tools' | 'gallery'>('overview');

  // Generate QR
  useEffect(() => {
    if (!galleryUrl) return;
    QRCodeLib.toDataURL(galleryUrl, { width: 280, margin: 1, errorCorrectionLevel: 'H' }).then(setQrDataUrl);
  }, [galleryUrl]);

  // Photo URLs
  const photoUrls = items.map(p => ({
    photo: p,
    url: (p.public_url ?? p.url ?? getPhotoPublicUrl(String(p.storage_path ?? p.file_path ?? ''), tenantAppUrl)) as string,
  }));

  // Copy URL
  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(galleryUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }, [galleryUrl]);

  // Update event name
  const updateName = useCallback(async (name: string) => {
    if (!name.trim()) return;
    try {
      await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      setEvent(prev => ({ ...prev, name: name.trim() }));
      setEventName(name.trim());
    } catch { /* ignore */ }
    setEditingName(false);
  }, [event.id]);

  // Upload image (header or profile)
  const uploadImage = useCallback(async (type: 'header' | 'profile') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      type === 'header' ? setUploadingHeader(true) : setUploadingProfile(true);
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('eventId', event.id);
        form.append('filename', `${type}-${Date.now()}.${file.name.split('.').pop()}`);
        const res = await fetch('/api/upload/chunked', { method: 'POST', body: form });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json() as { success: boolean; data: { url: string } };
        if (!data.success) throw new Error('Upload failed');
        const url = data.data.url;
        // Update event record
        await fetch(`/api/events/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(type === 'header' ? { header_image: url } : { profile_image: url }),
        });
        if (type === 'header') setHeaderImage(url);
        else setProfileImage(url);
      } catch { /* ignore */ }
      type === 'header' ? setUploadingHeader(false) : setUploadingProfile(false);
    };
    input.click();
  }, [event.id]);

  // Delete photo
  const deletePhoto = useCallback(async (photo: PhotoRecord) => {
    setDeleting(photo.id);
    const res = await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' });
    setDeleting(null);
    if (res.ok) setItems(prev => prev.filter(p => p.id !== photo.id));
    setConfirmDelete(null);
  }, []);

  // Set cover photo
  const setCover = useCallback(async (url: string) => {
    setCoverPhotoUrl(url);
    setShowCoverPicker(false);
    await fetch('/api/events/cover', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: event.id, photoPath: url }),
    });
  }, [event.id]);

  // Download QR
  const downloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${eventName}-qr-code.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, [qrDataUrl, eventName]);

  const sectionBtn = (section: typeof activeSection, label: string) => (
    <button
      onClick={() => setActiveSection(section)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeSection === section ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      style={activeSection === section ? { backgroundColor: primaryColor } : {}}
    >
      {label}
    </button>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="relative">
        {headerImage ? (
          <div className="relative h-48 w-full overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={headerImage} alt="Header" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button onClick={() => uploadImage('header')} className="bg-white/90 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" /> Change
              </button>
              <button onClick={() => setHeaderImage(null)} className="bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-medium">Remove</button>
            </div>
          </div>
        ) : (
          <div
            className="relative h-48 w-full border-b-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer flex flex-col items-center justify-center text-gray-400 group transition-colors"
            style={{ background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08)` }}
            onClick={() => uploadImage('header')}
          >
            {uploadingHeader ? <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} /> : (
              <>
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" style={{ color: primaryColor }} />
                <p className="text-sm font-medium" style={{ color: primaryColor }}>Add Header Image</p>
                <p className="text-xs opacity-60" style={{ color: primaryColor }}>1920 × 256px recommended</p>
              </>
            )}
          </div>
        )}

        {/* Nav bar */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tenant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logo_url} alt={tenant.name} className="h-10 w-auto object-contain" />
              ) : (
                <div className="h-10 px-3 rounded-lg flex items-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                  {tenant?.name?.substring(0, 2).toUpperCase() || 'SX'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/e/${event.slug}/upload`} className="flex items-center gap-2 px-3 py-2 text-white rounded-lg font-medium text-sm transition-colors" style={{ backgroundColor: primaryColor }}>
                <Upload className="w-4 h-4" /> Upload
              </Link>
              <Link href={galleryUrl} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                <Eye className="w-4 h-4" /> Gallery
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Section tabs */}
        <div className="flex gap-2">
          {sectionBtn('overview', 'Overview')}
          {sectionBtn('tools', 'Tools & QR')}
          {sectionBtn('gallery', 'Photos')}
        </div>

        {/* ── SECTION: OVERVIEW ── */}
        {activeSection === 'overview' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile image */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full p-1 shadow-lg group relative" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}88)` }}>
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileImage} alt={eventName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center cursor-pointer" onClick={() => uploadImage('profile')}>
                        {uploadingProfile ? <Loader2 className="w-6 h-6 animate-spin text-gray-400" /> : <Camera className="w-8 h-8 text-gray-400" />}
                      </div>
                    )}
                    {profileImage && (
                      <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button onClick={() => uploadImage('profile')} className="bg-white/90 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">Edit</button>
                        <button onClick={() => setProfileImage(null)} className="bg-red-500/90 text-white px-2 py-0.5 rounded text-xs font-medium">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">Profile</p>
              </div>

              {/* Event meta */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Event name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Event Name</label>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={eventName}
                        onChange={e => setEventName(e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{ borderColor: primaryColor, outlineColor: primaryColor }}
                        onKeyDown={e => { if (e.key === 'Enter') updateName(eventName); if (e.key === 'Escape') { setEditingName(false); setEventName(String(event.name ?? '')); } }}
                        autoFocus
                      />
                      <button onClick={() => updateName(eventName)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium">Save</button>
                      <button onClick={() => { setEditingName(false); setEventName(String(event.name ?? '')); }} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-xl font-bold text-gray-900">{eventName}</span>
                      <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: primaryColor }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>Active
                  </span>
                </div>

                {/* Photo count */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Photos Uploaded</label>
                  <span className="text-2xl font-bold" style={{ color: primaryColor }}>{items.length}</span>
                </div>

                {/* Gallery URL */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gallery URL</label>
                  <div className="flex items-center gap-2">
                    <input type="text" value={galleryUrl} readOnly className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono" />
                    <button onClick={copyUrl} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white" style={{ backgroundColor: urlCopied ? '#22c55e' : primaryColor }}>
                      {urlCopied ? <><Check className="w-4 h-4 inline mr-1" />Copied</> : <><Copy className="w-4 h-4 inline mr-1" />Copy</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: TOOLS & QR ── */}
        {activeSection === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <QrCode className="w-5 h-5" style={{ color: primaryColor }} /> QR Code & Share
              </h3>
              {qrDataUrl ? (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR Code" className="rounded-lg border border-gray-200 shadow-sm" style={{ width: 240, height: 240 }} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-60 bg-gray-50 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={downloadQR} disabled={!qrDataUrl} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-lg font-medium text-sm" style={{ backgroundColor: primaryColor }}>
                  <Download className="w-4 h-4" /> Download QR
                </button>
                <button onClick={copyUrl} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">
                  {urlCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {urlCopied ? 'Copied' : 'Copy Link'}
                </button>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">How to use:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Print or display the QR code at your event</li>
                  <li>• Guests scan with their phone camera</li>
                  <li>• They can immediately upload and view photos</li>
                  <li>• No app download required!</li>
                </ul>
              </div>
            </div>

            {/* Social Share Cover */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="flex items-center gap-2 font-bold text-gray-800">
                <Share2 className="w-5 h-5" style={{ color: primaryColor }} /> Social Cover Photo
              </h3>
              <p className="text-sm text-gray-500">Choose a landscape photo for link previews on social media.</p>
              {coverPhotoUrl ? (
                <div className="relative aspect-[1.91/1] w-full overflow-hidden rounded-xl border-2 shadow-sm" style={{ borderColor: primaryColor }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-medium">✓ Cover set</div>
                </div>
              ) : (
                <div className="aspect-[1.91/1] w-full rounded-xl flex items-center justify-center text-center px-4" style={{ background: `${primaryColor}08`, border: `2px dashed ${primaryColor}40` }}>
                  <div>
                    <Share2 className="w-8 h-8 mx-auto mb-2 opacity-40" style={{ color: primaryColor }} />
                    <p className="text-sm font-medium text-gray-500">No cover photo selected</p>
                    <p className="text-xs text-gray-400 mt-1">System will auto-select a landscape photo</p>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowCoverPicker(true)} disabled={items.length === 0} className="flex-1 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                  {coverPhotoUrl ? 'Change Cover' : 'Select Cover'}
                </button>
                {coverPhotoUrl && (
                  <button onClick={() => setCoverPhotoUrl(null)} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium">Remove</button>
                )}
              </div>

              {/* Customization */}
              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h4 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Customization
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Header Image</p>
                    <button onClick={() => uploadImage('header')} className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-colors" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                      {uploadingHeader ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4" />{headerImage ? 'Change' : 'Upload'}</>}
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Profile Image</p>
                    <button onClick={() => uploadImage('profile')} className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg text-sm font-medium transition-colors" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>
                      {uploadingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" />{profileImage ? 'Change' : 'Upload'}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: GALLERY ── */}
        {activeSection === 'gallery' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: primaryColor }} /> Photo Gallery
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{items.length} photo{items.length !== 1 ? 's' : ''}</p>
              </div>
              <Link href={`/e/${event.slug}/upload`} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ backgroundColor: primaryColor }}>
                <Upload className="w-4 h-4" /> Upload More
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <ImageIcon className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No photos yet. Share the gallery link for guests to start uploading.</p>
                <button onClick={copyUrl} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                  <Copy className="w-4 h-4" /> Copy Gallery Link
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {photoUrls.map(({ photo, url }) => (
                  <div key={photo.id} className="overflow-hidden rounded-lg border border-gray-200 group">
                    <button type="button" className="block w-full aspect-square overflow-hidden bg-gray-100" onClick={() => setActive(photo)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition" />
                    </button>
                    <div className="flex items-center justify-between gap-1 p-1.5">
                      <button onClick={() => setCover(url)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" title="Set as cover">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(photo)}
                        disabled={deleting === photo.id}
                        className="rounded p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === photo.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cover photo picker modal */}
      {showCoverPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Select Cover Photo</h3>
              <button onClick={() => setShowCoverPicker(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photoUrls.map(({ photo, url }) => {
                  const isSelected = coverPhotoUrl === url;
                  return (
                    <div key={photo.id} onClick={() => setCover(url)} className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-offset-2' : 'border-gray-200'}`} style={isSelected ? { borderColor: primaryColor, ringColor: primaryColor } : {}}>
                      <div className="aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}33` }}>
                          <div className="rounded-full p-2 text-white" style={{ backgroundColor: primaryColor }}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <ConfirmModal
          message="Delete this photo permanently? This cannot be undone."
          onConfirm={() => deletePhoto(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Lightbox */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setActive(null)}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          {(() => {
            const url = (active.public_url ?? active.url ?? getPhotoPublicUrl(String(active.storage_path ?? active.file_path ?? ''), tenantAppUrl)) as string;
            return (
              <div className="flex max-h-full max-w-5xl flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="max-h-[80vh] w-auto rounded object-contain" />
                <a href={url} download className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-950">
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </div>
            );
          })()}
        </div>
      )}

      {/* Lock icon placeholder for premium features */}
      <div className="hidden"><Lock /></div>
    </div>
  );
}
