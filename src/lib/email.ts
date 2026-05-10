import { Resend } from "resend";
import type { WlTenant } from "@/lib/types";

// Support both RESEND_API_KEY and RESEND_KEY env var names
const resendKey = process.env.RESEND_API_KEY ?? process.env.RESEND_KEY;
const resend = resendKey ? new Resend(resendKey) : null;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://snapworxxpro.com";
const APP_HOST = new URL(APP_URL).hostname; // snapworxxpro.com

function fromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? `SnapWorxx Pro <noreply@snapworxxpro.com>`;
}

function getTenantBaseUrl(tenant: WlTenant): string {
  if (tenant.custom_domain) return `https://${tenant.custom_domain}`;
  if (tenant.subdomain) return `https://${tenant.subdomain}.${APP_HOST}`;
  return APP_URL;
}

function planEmailLimit(plan: string): number {
  switch (plan) {
    case "pro": return 1000;
    case "studio": return 2500;
    case "agency": return 5000;
    default: return 500; // starter
  }
}

export async function sendTenantWelcomeEmail(tenant: WlTenant) {
  if (!resend) return;

  const baseUrl = getTenantBaseUrl(tenant);

  await resend.emails.send({
    from: fromEmail(),
    to: tenant.owner_email,
    subject: `Your ${tenant.name} workspace is ready`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto">
        ${tenant.logo_url ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="max-height:56px;margin-bottom:24px" />` : ""}
        <h1 style="color:${tenant.primary_color};margin:0 0 16px">${tenant.name} is ready 🎉</h1>
        <p>Your branded photo-sharing workspace has been set up and is live.</p>
        <p><strong>Your dashboard:</strong> <a href="${baseUrl}/tenant">${baseUrl}/tenant</a></p>
        <p><strong>Login:</strong> <a href="${baseUrl}/login">${baseUrl}/login</a></p>
        <p style="margin-top:24px">
          <a href="${baseUrl}/login" style="background:${tenant.primary_color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Go to your dashboard →
          </a>
        </p>
        <p style="margin-top:24px;color:#6b7280;font-size:14px">
          Create your first event, share the QR code with guests, and manage all photos from your dashboard.
        </p>
        <p style="margin-top:32px;color:#9ca3af;font-size:12px">Powered by SnapWorxx Pro</p>
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
    subject: `${params.eventName} — your gallery is live`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto">
        ${tenant.logo_url ? `<img src="${tenant.logo_url}" alt="${tenant.name}" style="max-height:56px;margin-bottom:24px" />` : ""}
        <h1 style="color:${tenant.primary_color};margin:0 0 16px">${params.eventName}</h1>
        <p>Your event gallery is live and ready for guest uploads.</p>
        <p style="margin-top:24px">
          <a href="${params.dashboardUrl}" style="background:${tenant.primary_color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            Open dashboard →
          </a>
        </p>
        <p style="margin-top:16px">Share this link with guests to upload photos:<br/>
          <a href="${params.galleryUrl}">${params.galleryUrl}</a>
        </p>
        <p style="margin-top:32px;color:#9ca3af;font-size:12px">Sent by ${tenant.name} · Powered by SnapWorxx Pro</p>
      </div>
    `
  });
}

export async function sendStorageWarningEmail(tenant: WlTenant, pct: number) {
  if (!resend) return;
  const baseUrl = getTenantBaseUrl(tenant);
  const isGated = pct >= 100;

  await resend.emails.send({
    from: fromEmail(),
    to: tenant.owner_email,
    subject: isGated ? `[Action Required] Storage full — ${tenant.name}` : `Storage at ${pct}% — ${tenant.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto">
        <h1 style="color:${isGated ? "#dc2626" : "#f59e0b"};margin:0 0 16px">
          ${isGated ? "⛔ Storage Full" : "⚠️ Storage Warning"}
        </h1>
        <p>Your ${tenant.name} workspace is at <strong>${pct}%</strong> of its storage limit.</p>
        ${isGated
          ? `<p style="color:#dc2626">Photo uploads have been paused. Please contact support or upgrade your plan to resume uploads.</p>`
          : `<p>You're approaching your storage limit. Consider upgrading your plan to avoid interruptions.</p>`
        }
        <p style="margin-top:24px">
          <a href="${baseUrl}/tenant" style="background:${tenant.primary_color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
            View dashboard →
          </a>
        </p>
        <p style="margin-top:32px;color:#9ca3af;font-size:12px">Powered by SnapWorxx Pro</p>
      </div>
    `
  });
}

// ── Promo account claimed — sent immediately after claim/[token] setup ────────

export async function sendPromoWelcomeEmail(params: {
  to: string;
  businessName: string;
  subdomain: string;
  dashboardUrl: string;
  loginUrl: string;
}) {
  if (!resend) return;

  await resend.emails.send({
    from: fromEmail(),
    to: params.to,
    subject: `Your SnapWorxx Pro account is ready — ${params.businessName}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#530792,#7c3aed);padding:32px;border-radius:16px 16px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px">🎉 Your account is live!</h1>
        </div>
        <div style="background:#fafafa;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:0">
          <p>Hi there,</p>
          <p><strong>${params.businessName}</strong> is set up and ready to go on SnapWorxx Pro.</p>

          <div style="background:#f3e8ff;border:1px solid #ddd6fe;border-radius:12px;padding:20px;margin:24px 0">
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280">Your dashboard</p>
            <a href="${params.dashboardUrl}" style="color:#530792;font-weight:bold;font-size:16px">${params.subdomain}.snapworxxpro.com</a>
          </div>

          <p><strong>What you can do right now:</strong></p>
          <ul style="color:#374151;padding-left:20px">
            <li>Create your first event gallery</li>
            <li>Share your QR code with guests to collect photos</li>
            <li>Upload your logo and set your brand colors</li>
          </ul>

          <p style="margin-top:24px">
            <a href="${params.dashboardUrl}" style="background:linear-gradient(135deg,#530792,#7c3aed);color:white;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">
              Go to your dashboard →
            </a>
          </p>

          <p style="margin-top:24px;font-size:13px;color:#6b7280">
            Log in anytime at <a href="${params.loginUrl}" style="color:#530792">${params.loginUrl}</a><br/>
            using the email and password you set during setup.
          </p>

          <p style="margin-top:32px;color:#9ca3af;font-size:12px">
            Powered by SnapWorxx Pro · <a href="https://snapworxxpro.com" style="color:#9ca3af">snapworxxpro.com</a>
          </p>
        </div>
      </div>
    `
  });
}

export { planEmailLimit, getTenantBaseUrl };
