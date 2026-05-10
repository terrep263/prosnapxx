import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";

const routes = [
  { name: "Marketing Page", url: "https://snapworxxpro.com/" },
  { name: "Signup", url: "https://snapworxxpro.com/signup" },
  { name: "Login", url: "https://snapworxxpro.com/login" },
  { name: "Health API", url: "https://snapworxxpro.com/api/health" },
  { name: "Check Subdomain", url: "https://snapworxxpro.com/api/check-subdomain?subdomain=test" },
  { name: "Admin Login", url: "https://snapworxxpro.com/admin/login" },
  { name: "Admin Dashboard", url: "https://snapworxxpro.com/admin" },
];

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await Promise.all(
    routes.map(async (route) => {
      const start = Date.now();
      try {
        const res = await fetch(route.url, { method: "GET", signal: AbortSignal.timeout(8000), redirect: "follow" });
        return { ...route, status: res.status, ok: res.status < 400, latency: Date.now() - start };
      } catch (err) {
        return { ...route, status: 0, ok: false, latency: Date.now() - start, error: String(err) };
      }
    })
  );

  return NextResponse.json(results);
}
