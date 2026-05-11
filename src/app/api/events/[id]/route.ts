import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getTenant } from '@/lib/server-tenant';
import { requireTenantOwner } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenant = await getTenant();
    await requireTenantOwner(tenant);

    const body = await request.json() as Record<string, unknown>;
    const supabase = getServiceRoleClient();

    // Only allow safe fields
    const allowed = ['name', 'title', 'header_image', 'profile_image', 'cover_photo_url'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('events')
      .update(update)
      .eq('id', id)
      .eq('tenant_id', tenant.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
