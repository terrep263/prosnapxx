"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, AlertTriangle } from "lucide-react";

type Setting = { key: string; value: { enabled: boolean; message: string } };

export default function SettingsPage() {
  const router = useRouter();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string }>({ enabled: false, message: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data: Setting[] = await res.json();
      const m = data.find((s) => s.key === "maintenance_mode");
      if (m) setMaintenance(m.value);
    }
    setLoading(false);
  }

  async function saveMaintenance() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "maintenance_mode", value: maintenance })
    });
    setSaving(false);
    showToast(res.ok ? "Settings saved" : "Failed to save");
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg" style={{ background: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>
          {toast}
        </div>
      )}

      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">System Settings</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {loading ? (
          <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</div>
        ) : (
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <h2 className="text-base font-bold text-white">Maintenance Mode</h2>
            </div>

            <div className="space-y-5">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Enable Maintenance Mode</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Shows maintenance message to all visitors. Admin panel remains accessible.
                  </div>
                </div>
                <button
                  onClick={() => setMaintenance((m) => ({ ...m, enabled: !m.enabled }))}
                  className="relative h-6 w-11 rounded-full transition-all"
                  style={{ background: maintenance.enabled ? "linear-gradient(135deg, #530792, #7c3aed)" : "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                    style={{ left: maintenance.enabled ? "calc(100% - 22px)" : "2px" }}
                  />
                </button>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Maintenance Message</label>
                <textarea
                  value={maintenance.message}
                  onChange={(e) => setMaintenance((m) => ({ ...m, message: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  placeholder="We are performing scheduled maintenance. Please check back soon."
                />
              </div>

              {maintenance.enabled && (
                <div className="rounded-xl px-4 py-3" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="text-xs font-semibold text-yellow-400">⚠️ Maintenance mode is ON — visitors will see the maintenance message.</div>
                </div>
              )}

              <button
                onClick={saveMaintenance}
                disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
              >
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
