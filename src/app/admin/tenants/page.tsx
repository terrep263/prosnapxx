"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, XCircle, Flag, Mail,
  RefreshCw, ChevronLeft, ToggleLeft, ToggleRight
} from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  owner_email: string;
  subdomain: string | null;
  custom_domain: string | null;
  plan: string;
  plan_status: string;
  active: boolean;
  flagged: boolean;
  internal_notes: string | null;
  events_this_month: number;
  events_limit: number;
  storage_used_gb: number;
  storage_limit_gb: number;
  storage_add_on_gb: number;
  emails_sent_this_month: number;
  emails_limit: number;
  created_at: string;
};

function UsageBar({ used, limit, addOn = 0 }: { used: number; limit: number; addOn?: number }) {
  const total = limit + addOn;
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const color = pct >= 100 ? "#dc2626" : pct >= 80 ? "#f59e0b" : "#530792";
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        <span>{used} / {total}</span>
        <span style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "rgba(34,197,94,0.2)",
    trialing: "rgba(83,7,146,0.3)",
    past_due: "rgba(245,158,11,0.2)",
    canceled: "rgba(220,38,38,0.2)"
  };
  const text: Record<string, string> = {
    active: "#86efac",
    trialing: "#c084fc",
    past_due: "#fcd34d",
    canceled: "#fca5a5"
  };
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: colors[status] ?? "rgba(255,255,255,0.1)", color: text[status] ?? "#fff" }}
    >
      {status}
    </span>
  );
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editNotes, setEditNotes] = useState<{ id: string; notes: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tenants");
    if (res.ok) setTenants(await res.json());
    setLoading(false);
  }

  async function patch(id: string, updates: Partial<Tenant>) {
    const res = await fetch("/api/admin/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates })
    });
    if (res.ok) {
      const updated = await res.json();
      setTenants((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast("Updated successfully");
    } else {
      showToast("Update failed", false);
    }
  }

  async function resendWelcome(tenantId: string) {
    const res = await fetch("/api/admin/tenants/resend-welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId })
    });
    showToast(res.ok ? "Welcome email sent" : "Failed to send email", res.ok);
  }

  useEffect(() => { load(); }, []);

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.owner_email.toLowerCase().includes(search.toLowerCase()) ||
    (t.subdomain ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          style={{ background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)", color: toast.ok ? "#86efac" : "#fca5a5", border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}` }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">Tenants</span>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Tenants", value: tenants.length },
            { label: "Active", value: tenants.filter((t) => t.active).length },
            { label: "Trialing", value: tenants.filter((t) => t.plan_status === "trialing").length },
            { label: "Flagged", value: tenants.filter((t) => t.flagged).length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or subdomain…"
          className="mb-6 w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        />

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading tenants…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No tenants found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => {
              const storageTotal = t.storage_limit_gb + t.storage_add_on_gb;
              const storagePct = storageTotal > 0 ? (t.storage_used_gb / storageTotal) * 100 : 0;
              const emailPct = t.emails_limit > 0 ? (t.emails_sent_this_month / t.emails_limit) * 100 : 0;
              const eventPct = t.events_limit > 0 ? (t.events_this_month / t.events_limit) * 100 : 0;
              const hasWarning = storagePct >= 80 || emailPct >= 80 || eventPct >= 80;
              const isGated = storagePct >= 100;

              return (
                <div
                  key={t.id}
                  className="rounded-2xl p-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${isGated ? "rgba(220,38,38,0.4)" : hasWarning ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`,
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left — identity */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{t.name}</span>
                        <StatusBadge status={t.plan_status} />
                        <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(83,7,146,0.3)", color: "#c084fc" }}>
                          {t.plan}
                        </span>
                        {t.flagged && <Flag className="h-4 w-4 text-yellow-400" />}
                        {isGated && <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(220,38,38,0.2)", color: "#fca5a5" }}>GATED</span>}
                        {hasWarning && !isGated && <AlertTriangle className="h-4 w-4 text-yellow-400" />}
                      </div>
                      <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {t.owner_email} · {t.subdomain ? `${t.subdomain}.snapworxxpro.com` : t.custom_domain ?? "no domain"}
                      </div>
                      {t.internal_notes && (
                        <div className="mt-2 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(245,158,11,0.1)", color: "#fcd34d" }}>
                          📝 {t.internal_notes}
                        </div>
                      )}
                    </div>

                    {/* Right — actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => patch(t.id, { active: !t.active })}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: t.active ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)", color: t.active ? "#86efac" : "#fca5a5", border: `1px solid ${t.active ? "rgba(34,197,94,0.2)" : "rgba(220,38,38,0.2)"}` }}
                      >
                        {t.active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        {t.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => patch(t.id, { flagged: !t.flagged })}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.2)" }}
                      >
                        <Flag className="h-3.5 w-3.5" /> {t.flagged ? "Unflag" : "Flag"}
                      </button>
                      <button
                        onClick={() => resendWelcome(t.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: "rgba(83,7,146,0.2)", color: "#c084fc", border: "1px solid rgba(83,7,146,0.3)" }}
                      >
                        <Mail className="h-3.5 w-3.5" /> Welcome
                      </button>
                      <button
                        onClick={() => setEditNotes({ id: t.id, notes: t.internal_notes ?? "" })}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        📝 Notes
                      </button>
                      <button
                        onClick={() => patch(t.id, { events_this_month: 0 })}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Reset Events
                      </button>
                    </div>
                  </div>

                  {/* Usage bars */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="mb-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Storage</div>
                      <UsageBar used={t.storage_used_gb} limit={t.storage_limit_gb} addOn={t.storage_add_on_gb} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Events this month</div>
                      <UsageBar used={t.events_this_month} limit={t.events_limit === -1 ? 999 : t.events_limit} />
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Emails this month</div>
                      <UsageBar used={t.emails_sent_this_month} limit={t.emails_limit} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Notes Modal */}
      {editNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#1a0030", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="mb-4 text-base font-bold text-white">Internal Notes</h3>
            <textarea
              value={editNotes.notes}
              onChange={(e) => setEditNotes({ ...editNotes, notes: e.target.value })}
              rows={4}
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Internal notes about this tenant…"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setEditNotes(null)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await patch(editNotes.id, { internal_notes: editNotes.notes });
                  setEditNotes(null);
                }}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
