'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Zap, Lock, Share2 } from 'lucide-react';
import { useTenant } from '@/lib/tenant';

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const tenant = useTenant();
  const primaryColor = tenant?.primary_color || '#9333ea';

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Record<string, 'success' | 'error'>>({});

  useEffect(() => { loadEvent(); }, [slug]);

  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/events/by-slug/${slug}`);
      if (!res.ok) { router.push(`/e/${slug}/gallery`); return; }
      const data = await res.json();
      setEvent(data.event);
    } catch { router.push(`/e/${slug}/gallery`); }
    finally { setLoading(false); }
  };

  const handleFiles = async (files: FileList) => {
    if (!files.length || !event?.id) return;
    setUploading(true);
    const p: Record<string, number> = {};
    const r: Record<string, 'success' | 'error'> = {};
    for (const file of Array.from(files)) {
      const key = `${file.name}-${file.size}`;
      p[key] = 10; setProgress({ ...p });
      try {
        const form = new FormData();
        form.append('file', file);
        form.append('eventId', event.id);
        form.append('filename', file.name);
        const iv = setInterval(() => { p[key] = Math.min((p[key] || 10) + 10, 90); setProgress({ ...p }); }, 300);
        const res = await fetch('/api/upload/chunked', { method: 'POST', body: form });
        clearInterval(iv);
        p[key] = 100; setProgress({ ...p });
        if (!res.ok) throw new Error('Failed');
        r[key] = 'success';
      } catch { r[key] = 'error'; }
      setResults({ ...r });
    }
    setUploading(false);
    const allOk = Object.values(r).every(v => v === 'success');
    if (allOk) setTimeout(() => router.push(`/e/${slug}/gallery`), 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
    </div>
  );

  if (!event) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 sticky top-0 z-40 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href={`/e/${slug}/gallery`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium text-sm">
              <ArrowLeft size={18} /> Back to Gallery
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900 line-clamp-1">{event.name}</h1>
            <p className="text-xs text-gray-500">Upload Your Memories</p>
          </div>
          <div className="hidden sm:block w-32" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Left — info */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Share Your<br /><span style={{ color: primaryColor }}>Moments</span>
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Upload your photos and videos from <strong className="text-gray-900">{event.name}</strong>. Your memories will be instantly available in the gallery.
            </p>
            <div className="space-y-5">
              {[
                { icon: Upload, title: 'Easy Upload', desc: 'Drag and drop or click to select. Multiple files at once.' },
                { icon: Zap, title: 'Instant Sharing', desc: 'Uploads appear immediately in the gallery for all guests.' },
                { icon: Lock, title: 'Secure Storage', desc: 'Your memories are safely stored and backed up automatically.' },
                { icon: Share2, title: 'Shareable Gallery', desc: 'All photos are accessible in a beautiful gallery.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}18` }}>
                    <Icon className="h-6 w-6" style={{ color: primaryColor }} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-0.5">{title}</h3>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — upload */}
          <div>
            <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Upload Your Files</h3>
              <div
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
                onClick={() => document.getElementById('wl-upload-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}
                style={dragActive ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : {}}
              >
                <input id="wl-upload-input" type="file" multiple accept="image/*,video/*,.heic,.heif,.mov" className="hidden" onChange={e => { if (e.target.files) handleFiles(e.target.files); }} />
                <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" strokeWidth={1.5} />
                <p className="font-semibold text-gray-900 mb-1">{uploading ? 'Uploading...' : 'Drop photos & videos here'}</p>
                <p className="text-sm text-gray-500 mb-3">or <span style={{ color: primaryColor }} className="font-semibold">browse files</span></p>
                <p className="text-xs text-gray-400">JPG, PNG, MP4, MOV, HEIC • Up to 500MB per video</p>
              </div>

              {Object.keys(progress).length > 0 && (
                <div className="mt-6 space-y-3">
                  {Object.entries(progress).map(([key, pct]) => {
                    const name = key.split('-')[0];
                    const result = results[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${result === 'success' ? 'bg-green-100' : result === 'error' ? 'bg-red-100' : 'bg-gray-100'}`}>
                          {result === 'success' && <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          {result === 'error' && <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                          {!result && <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5"><span className="text-gray-700 truncate">{name}</span><span style={{ color: primaryColor }}>{pct}%</span></div>
                          {!result && <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: primaryColor }} /></div>}
                          {result && <p className={`text-xs ${result === 'success' ? 'text-green-600' : 'text-red-600'}`}>{result === 'success' ? 'Upload complete' : 'Upload failed'}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-300">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">How it works</h4>
                <ol className="text-xs text-gray-600 space-y-1.5">
                  <li><strong>1.</strong> Select photos or videos from your device</li>
                  <li><strong>2.</strong> Watch the progress as files upload securely</li>
                  <li><strong>3.</strong> You'll be redirected to the gallery when complete</li>
                  <li><strong>4.</strong> Your photos are now visible to all guests!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
