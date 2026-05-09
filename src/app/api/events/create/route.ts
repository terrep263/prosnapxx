import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenant, getTenantAppUrl } from "@/lib/server-tenant";
import { getServiceRoleClient } from "@/lib/supabase";
import { toSlug, randomSuffix } from "@/lib/slug";
import { sendEventConfirmationEmail } from "@/lib/email";

const schema = z.object({
  name: z.string().min(2).max(160),
  ownerEmail: z.string().email()
});

export async function POST(request: NextRequest) {
  const tenant = await getTenant();
  const body = schema.parse(await request.json());

  if (tenant.events_limit !== -1 && tenant.events_this_month >= tenant.events_limit) {
    return NextResponse.json({ error: "Event limit reached" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  const slug = `${toSlug(body.name)}-${randomSuffix()}`;
  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: body.name,
      title: body.name,
      slug,
      owner_email: body.ownerEmail,
      tenant_id: tenant.id
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("wl_tenants").update({ events_this_month: tenant.events_this_month + 1 }).eq("id", tenant.id);

  const appUrl = getTenantAppUrl(tenant);
  const dashboardUrl = `${appUrl}/dashboard/${event.id}`;
  const galleryUrl = `${appUrl}/e/${event.slug}/gallery`;
  await sendEventConfirmationEmail({ to: body.ownerEmail, eventName: body.name, dashboardUrl, galleryUrl }, tenant);

  return NextResponse.json({ dashboardUrl });
}
