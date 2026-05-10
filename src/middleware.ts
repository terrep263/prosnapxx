import { NextRequest, NextResponse } from "next/server";
import type { WlTenant } from "@/lib/types";

const ADMIN_COOKIE = "swp_admin_token";

type CacheEntry = { tenant: WlTenant | null; expiresAt: number };

const tenantCache = new Map<string, CacheEntry>();
const publicPaths = ["/signup", "/login", "/api/stripe-webhook", "/api/health", "/api/check-subdomain", "/api/admin", "/api/claim", "/claim", "/api/owner"];
const ownerPaths = ["/tenant"];

function localDevelopmentTenant(hostname: string): WlTenant | null {
  if (process.env.NODE_ENV === "production") return null;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return null;

  return {
    id: "00000000-0000-4000-8000-000000000000",
    created_at: new Date(0).toISOString(),
    slug: "local-preview",
    name: "Local Preview",
    owner_email: "owner@example.com",
    logo_url: null,
    primary_color: "#530792",
    secondary_color: "#F59E0B",
    custom_domain: null,
    subdomain: "local",
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    plan: "starter",
    plan_status: "trialing",
    events_this_month: 0,
    events_limit: 10,
    storage_used_gb: 0,
    storage_limit_gb: 10,
    active: true
  };
}

function normalizeHost(host: string) {
  return host.split(":")[0].toLowerCase();
}

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isRootDomain(hostname: string) {
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://snapworxxpro.com").hostname.toLowerCase();
  return hostname === appHost || hostname === `www.${appHost}`;
}

function isStaticPath(pathname: string) {
  return pathname.startsWith("/_next") || pathname === "/favicon.ico" || pathname === "/robots.txt";
}

function firstSubdomain(hostname: string) {
  const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://wl.snapworxx.com").hostname.toLowerCase();
  if (!hostname.endsWith(appHost)) return null;
  const prefix = hostname.slice(0, -appHost.length).replace(/\.$/, "");
  return prefix ? prefix.split(".")[0] : null;
}

async function lookupTenant(hostname: string): Promise<WlTenant | null> {
  const developmentTenant = localDevelopmentTenant(hostname);
  if (developmentTenant) return developmentTenant;

  const cached = tenantCache.get(hostname);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json"
  };

  let tenant: WlTenant | null = null;
  const byDomain = await fetch(
    `${supabaseUrl}/rest/v1/wl_tenants?custom_domain=eq.${encodeURIComponent(hostname)}&active=eq.true&select=*`,
    { headers, cache: "no-store" }
  );
  if (byDomain.ok) {
    tenant = ((await byDomain.json()) as WlTenant[])[0] ?? null;
  }

  if (!tenant) {
    const subdomain = firstSubdomain(hostname);
    if (subdomain) {
      const bySubdomain = await fetch(
        `${supabaseUrl}/rest/v1/wl_tenants?subdomain=eq.${encodeURIComponent(subdomain)}&active=eq.true&select=*`,
        { headers, cache: "no-store" }
      );
      if (bySubdomain.ok) {
        tenant = ((await bySubdomain.json()) as WlTenant[])[0] ?? null;
      }
    }
  }

  tenantCache.set(hostname, { tenant, expiresAt: Date.now() + 60_000 });
  return tenant;
}

function hasSupabaseSession(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.value.length > 20);
}

function hasOwnerSession(request: NextRequest) {
  return !!request.cookies.get("swp_owner_token")?.value;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  const hostname = normalizeHost(request.headers.get("host") ?? "");

  // Admin routes — check admin cookie
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!adminToken) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
    // Token presence check only in middleware — full validation in route handlers
    return NextResponse.next();
  }

  // Admin login page — redirect to admin if already logged in
  if (pathname === "/admin/login") {
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (adminToken) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      return NextResponse.redirect(adminUrl);
    }
    return NextResponse.next();
  }

  // Root domain (snapworxxpro.com) — serve marketing page, no tenant required
  if (isRootDomain(hostname)) {
    return NextResponse.next();
  }

  const tenant = await lookupTenant(hostname);

  if (!tenant && !isPublicPath(pathname)) {
    return new NextResponse("Tenant not found", { status: 404 });
  }

  if (tenant && ownerPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) && !hasSupabaseSession(request) && !hasOwnerSession(request)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  if (tenant) {
    requestHeaders.set("x-tenant-data", encodeURIComponent(JSON.stringify(tenant)));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!.*\\..*).*)", "/api/:path*"]
};
