import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getTenant } from '@/lib/server-tenant';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const tenant = await getTenant();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 1000);
    const offset = (page - 1) * limit;

    const supabase = getServiceRoleClient();

    const { data: event } = await supabase.from('events').select('id').eq('id', eventId).eq('tenant_id', tenant.id).single();
    if (!event) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const { data: photos, error, count } = await supabase
      .from('photos')
      .select('id, filename, url, storage_url, thumbnail_url, file_path, storage_path, size, type, mime_type, is_video, width, height, created_at, event_id, is_approved', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    const transformUrl = (url: string | null | undefined) => {
      if (!url) return '';
      if (url.includes('/api/img/')) return url;
      const m = url.match(/supabase\.co\/storage\/v1\/object\/public\/photos\/(.*)/);
      if (m) return `${appUrl}/api/img/${m[1]}`;
      if (!url.startsWith('http')) return `${appUrl}/api/img/${url}`;
      return url;
    };

    const transformed = (photos || []).map((p: Record<string, unknown>) => {
      const rawUrl = (p.storage_url || p.url || '') as string;
      const rawThumb = (p.thumbnail_url || rawUrl) as string;
      return {
        id: p.id,
        filename: (p.filename || 'photo') as string,
        original_filename: (p.filename || 'photo') as string,
        storage_url: transformUrl(rawUrl),
        thumbnail_url: transformUrl(rawThumb),
        url: transformUrl(rawUrl),
        width: p.width || null,
        height: p.height || null,
        uploaded_at: p.created_at,
        created_at: p.created_at,
        file_size: p.size || null,
        size: p.size || null,
        mime_type: (p.mime_type || p.type || 'image/jpeg') as string,
        is_video: p.is_video || false,
        is_approved: p.is_approved,
      };
    });

    const totalPhotos = count || transformed.length;
    const totalPages = Math.ceil(totalPhotos / limit);

    return NextResponse.json({
      success: true,
      data: {
        photos: transformed,
        pagination: { page, limit, totalPhotos, totalPages, hasMore: offset + transformed.length < totalPhotos },
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load gallery';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
