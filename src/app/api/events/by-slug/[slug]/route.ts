import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getTenant } from '@/lib/server-tenant';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const tenant = await getTenant();
    const supabase = getServiceRoleClient();

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('tenant_id', tenant.id)
      .single();

    if (error || !event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ event });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
