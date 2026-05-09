import { Resend } from "resend";
import type { WlTenant } from "@/lib/types";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "Photo Gallery <noreply@snapworxx.com>";
}

export async function sendTenantWelcomeEmail(tenant: WlTenant) {
  if (!resend) return;

  const baseUrl = tenant.custom_domain
    ? `https://${tenant.custom_domain}`
    : `${process.env.NEXT_PUBLIC_APP_URL?.replace("https://wl.", `https://${tenant.subdomain}.`) ?? ""}`;

  await resend.emails.send({
    from: fromEmail(),
    to: tenant.owner_email,
    subject: `Welcome to ${tenant.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        ${tenant.logo_url ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="max-height:56px;margin-bottom:24px" />` : ""}
        <h1 style="color:${tenant.primary_color};margin:0 0 16px">${tenant.name} is ready</h1>
        <p>Your branded photo-sharing workspace has been provisioned.</p>
        <p><strong>Gallery URL:</strong> <a href="${baseUrl}">${baseUrl}</a></p>
        <p><strong>Login:</strong> <a href="${baseUrl}/login">${baseUrl}/login</a></p>
        <p>Create your first event, share the event QR code with guests, and manage submitted photos from your dashboard.</p>
      </div>
    `
  });
}

export async function sendEventConfirmationEmail(
  params: { to: string; eventName: string; dashboardUrl: string; galleryUrl: string },
  tenant: WlTenant
) {
  if (!resend) return;

  await resend.emails.send({
    from: fromEmail(),
    to: params.to,
    subject: `${params.eventName} is ready`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        ${tenant.logo_url ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="max-height:56px;margin-bottom:24px" />` : ""}
        <h1 style="color:${tenant.primary_color};margin:0 0 16px">${params.eventName}</h1>
        <p>Your event gallery is ready for guest uploads.</p>
        <p><a href="${params.dashboardUrl}" style="background:${tenant.primary_color};color:white;padding:12px 18px;border-radius:6px;text-decoration:none">Open dashboard</a></p>
        <p>Guest gallery: <a href="${params.galleryUrl}">${params.galleryUrl}</a></p>
        <p>Sent by ${tenant.name}.</p>
      </div>
    `
  });
}
