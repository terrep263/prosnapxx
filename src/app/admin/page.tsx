import { requireAdmin } from "@/lib/admin-auth";

export default async function AdminPage() {
  const { admin } = await requireAdmin();

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0f0020", fontFamily: "'Sora', 'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Top nav */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <span className="text-sm font-bold text-white">SnapWorxx Pro</span>
            <span className="ml-2 rounded px-2 py-0.5 text-xs font-semibold" style={{ background: "rgba(83,7,146,0.4)", color: "#c084fc" }}>
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {admin.name} · {admin.role}
            </span>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(220,38,38,0.2)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.3)" }}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          Welcome back, {admin.name}. Admin panel is being built.
        </p>

        {/* Placeholder nav cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Tenants", desc: "View and manage all tenant accounts", href: "/admin/tenants" },
            { label: "Promo Accounts", desc: "Manage and distribute 20 promotional giveaway accounts", href: "/admin/promos" },
            { label: "Route Health", desc: "Real-time status of all platform routes", href: "/admin/health" },
            { label: "Impersonation", desc: "Log in as a tenant to debug their account", href: "/admin/tenants" },
            { label: "Audit Log", desc: "Full history of all admin actions", href: "/admin/audit" },
            { label: "System Settings", desc: "Maintenance mode and platform config", href: "/admin/settings" },
          { label: "Admin Users", desc: "Manage admin accounts and slots", href: "/admin/users" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block rounded-2xl p-6 transition-all hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.3)"
              }}
            >
              <div className="text-base font-semibold text-white">{item.label}</div>
              <div className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
