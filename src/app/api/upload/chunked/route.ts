import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getTenant } from '@/lib/server-tenant';

const BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? 'photos';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

function getPublicUrl(path: string) {
  return `${APP_URL}/api/img/${path}`;
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenant();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const eventId = formData.get('eventId') as string | null;
    const filename = formData.get('filename') as string | null;

    if (!file || !eventId) return NextResponse.json({ success: false, error: 'File and eventId required' }, { status: 400 });

    const supabase = getServiceRoleClient();

    // Verify event belongs to tenant
    const { data: event } = await supabase.from('events').select('id, max_storage_bytes, max_photos').eq('id', eventId).eq('tenant_id', tenant.id).single();
    if (!event) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = (filename || file.name).split('.').pop()?.toLowerCase() || 'jpg';
    const sanitized = (filename || file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${eventId}/${Date.now()}-${sanitized}`;

    const isImage = file.type.startsWith('image/') || ['jpg','jpeg','png','gif','webp','heic','heif'].includes(fileExt);
    const isVideo = file.type.startsWith('video/') || ['mp4','mov','avi','mkv','webm','flv','wmv','3gp','hevc'].includes(fileExt);

    // Determine MIME type
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
      mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
      mkv: 'video/x-matroska', webm: 'video/webm', hevc: 'video/mp4',
    };
    const fileType = file.type || mimeMap[fileExt] || 'application/octet-stream';

    // Upload to storage
    const blob = new Blob([buffer], { type: fileType });
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, blob, { cacheControl: '3600', contentType: fileType, upsert: false });
    if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

    const publicUrl = getPublicUrl(filePath);

    // Generate thumbnail path (for images, use same for now; videos use poster)
    const thumbnailUrl = publicUrl;

    // Insert photo record
    const { data: photo, error: dbError } = await supabase.from('photos').insert({
      event_id: eventId,
      filename: sanitized,
      url: publicUrl,
      storage_url: publicUrl,
      file_path: filePath,
      storage_path: filePath,
      thumbnail_url: thumbnailUrl,
      size: buffer.length,
      type: fileType,
      mime_type: fileType,
      is_video: isVideo,
      is_approved: true,
    }).select().single();

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([filePath]);
      throw new Error(`DB error: ${dbError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { id: photo.id, filename: photo.filename, url: photo.url, storage_url: photo.storage_url, thumbnail_url: photo.thumbnail_url, size: photo.size, is_video: photo.is_video },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Upload failed' }, { status: 500 });
  }
}
