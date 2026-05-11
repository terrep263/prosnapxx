'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { EventData } from '@/lib/gallery-utils';

export default function UploadModal({ isOpen, onClose, eventId, event, onUploadComplete }: {
  isOpen: boolean;
  onClose: () => void;
  eventSlug?: string;
  eventId?: string;
  event?: EventData;
  onUploadComplete?: () => void;
}) {
  const [files, setFiles] = useState<{ id: string; file: File; status: string; progress: number; error?: string }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<'select' | 'upload' | 'done'>('select');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryColor = event?.tenant_primary_color || '#9333ea';

  useEffect(() => {
    if (!isOpen) { setStep('select'); setFiles([]); setError(null); }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    const valid = arr.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/') || /\.(jpg|jpeg|png|heic|webp|mp4|mov|hevc)$/i.test(f.name));
    if (!valid.length) { setError('No supported files selected.'); return; }
    setError(null);
    setFiles(prev => [...prev, ...valid.map(f => ({ id: `${Date.now()}-${Math.random()}`, file: f, status: 'queued', progress: 0 }))]);
  }, []);

  const startUpload = useCallback(async () => {
    if (!files.length || !eventId) return;
    setStep('upload');
    for (const f of files) {
      setFiles(prev => prev.map(x => x.id === f.id ? { ...x, status: 'uploading' } : x));
      try {
        const form = new FormData();
        form.append('file', f.file);
        form.append('eventId', eventId);
        form.append('filename', f.file.name);
        let p = 0;
        const iv = setInterval(() => { p = Math.min(p + 10, 90); setFiles(prev => prev.map(x => x.id === f.id ? { ...x, progress: p } : x)); }, 200);
        const res = await fetch('/api/upload/chunked', { method: 'POST', body: form });
        clearInterval(iv);
        if (!res.ok) throw new Error('Upload failed');
        setFiles(prev => prev.map(x => x.id === f.id ? { ...x, status: 'done', progress: 100 } : x));
      } catch {
        setFiles(prev => prev.map(x => x.id === f.id ? { ...x, status: 'error', error: 'Failed' } : x));
      }
    }
    setStep('done');
  }, [files, eventId]);

  if (!isOpen) return null;

  const successCount = files.filter(f => f.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={step === 'select' ? onClose : undefined}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Upload Photos & Videos</h2>
          {step === 'select' && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
        <div className="p-6">
          {step === 'select' && (
            <div className="space-y-5">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}
              <div
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files); }}
                className="border-2 border-dashed rounded-xl p-12 text-center transition-colors"
                style={dragActive ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : { borderColor: '#d1d5db' }}
              >
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p className="font-semibold text-gray-900 mb-1">Drag & drop files here</p>
                <p className="text-gray-500 text-sm mb-3">or click to browse</p>
                <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2 text-white rounded-lg font-medium" style={{ backgroundColor: primaryColor }}>Browse Files</button>
                <p className="text-xs text-gray-400 mt-3">Photos: JPEG, PNG, HEIC, WebP &bull; Videos: MP4, MOV (max 500MB)</p>
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.heic,.heif,.mov,.mp4" className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
              {files.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 mb-2">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                    {files.map(f => (
                      <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-800 truncate flex-1">{f.file.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{(f.file.size / 1048576).toFixed(1)}MB</span>
                        <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="ml-2 text-gray-400 hover:text-red-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button onClick={startUpload} className="w-full py-3 text-white font-semibold rounded-lg" style={{ backgroundColor: primaryColor }}>
                    Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-900 mb-2">Uploading...</p>
              {files.map(f => (
                <div key={f.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-800 truncate">{f.file.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${f.status === 'done' ? 'bg-green-100 text-green-700' : f.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{f.status}</span>
                  </div>
                  {f.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${f.progress}%`, backgroundColor: primaryColor }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-xl font-bold text-gray-900">Upload Complete!</p>
              <p className="text-gray-500">{successCount} file{successCount !== 1 ? 's' : ''} uploaded successfully</p>
              <div className="flex gap-3 justify-center pt-2">
                <button onClick={() => { onUploadComplete?.(); onClose(); }} className="px-5 py-2.5 text-white font-semibold rounded-lg" style={{ backgroundColor: primaryColor }}>View in Gallery</button>
                <button onClick={() => { setStep('select'); setFiles([]); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200">Upload More</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
