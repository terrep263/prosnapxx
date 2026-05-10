"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, CheckCircle, XCircle, RefreshCw, Gift, RotateCcw } from "lucide-react";

type Promo = {
  id: string;
  name: string;
  subdomain: string;
  active: boolean;
  promo_claimed: boolean;
  promo_claimed_at: string | null;
  promo_claimed_by_email: string | null;
  promo_claim_token: string;
  plan_status: string;
};

export default function PromosPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    if (res.ok) setPromos(await res.json());
    setLoading(false);
  }

  async function action(id: string, act: "revoke" | "restore" | "reset") {
    const res = await fetch("/api/admin/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: act })
    });
    if (res.ok) {
      showToast(act === "revoke" ? "Account revoked" : act === "restore" ? "Account restored" : "Account reset — new link generated");
      load();
    } else {
      showToast("Action failed", false);
    }
  }

  function copyLink(token: string, id: string) {
    const url = `https://snapworxxpro.com/claim/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => { load(); }, []);

  const claimed = promos.filter((p) => p.promo_claimed).length;
  const active = promos.filter((p) => p.active && !p.promo_claimed).length;
  const revoked = promos.filter((p) => !p.active).length;

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg"
          style={{ background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)", color: toast.ok ? "#86efac" : "#fca5a5", border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}` }}>
          {toast.msg}
        </div>
      )}

      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">Promo Accounts</span>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Available", value: active, color: "#86efac" },
            { label: "Claimed", value: claimed, color: "#c084fc" },
            { label: "Revoked", value: revoked, color: "#fca5a5" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Promo list */}
        {loading ? (
          <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</div>
        ) : (
          <div className="space-y-3">
            {promos.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${!p.active ? "rgba(220,38,38,0.2)" : p.promo_claimed ? "rgba(83,7,146,0.3)" : "rgba(34,197,94,0.2)"}`
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Left */}
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
                      style={{ background: !p.active ? "rgba(220,38,38,0.15)" : p.promo_claimed ? "rgba(83,7,146,0.3)" : "rgba(34,197,94,0.15)" }}
                    >
                      <Gift className="h-4 w-4" style={{ color: !p.active ? "#fca5a5" : p.promo_claimed ? "#c084fc" : "#86efac" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{p.subdomain}.snapworxxpro.com</span>
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{
                            background: !p.active ? "rgba(220,38,38,0.15)" : p.promo_claimed ? "rgba(83,7,146,0.2)" : "rgba(34,197,94,0.15)",
                            color: !p.active ? "#fca5a5" : p.promo_claimed ? "#c084fc" : "#86efac"
                          }}
                        >
                          {!p.active ? "Revoked" : p.promo_claimed ? "Claimed" : "Available"}
                        </span>
                      </div>
                      {p.promo_claimed && p.promo_claimed_by_email && (
                        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {p.promo_claimed_by_email} · {new Date(p.promo_claimed_at!).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!p.promo_claimed && p.active && (
                      <button
                        onClick={() => copyLink(p.promo_claim_token, p.id)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{ background: "rgba(83,7,146,0.2)", color: "#c084fc", border: "1px solid rgba(83,7,146,0.3)" }}
                      >
                        {copied === p.id ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === p.id ? "Copied!" : "Copy Link"}
                      </button>
                    )}
                    {p.active && !p.promo_claimed && (
                      <button
                        onClick={() => action(p.id, "revoke")}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: "rgba(220,38,38,0.1)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Revoke
                      </button>
                    )}
                    {!p.active && (
                      <button
                        onClick={() => action(p.id, "restore")}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)" }}
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Restore
                      </button>
                    )}
                    {p.promo_claimed && (
                      <button
                        onClick={() => { if (confirm("Reset this account? The current owner will lose access and a new claim link will be generated.")) action(p.id, "reset"); }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.2)" }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Reset
                      </button>
                    )}
                    {p.promo_claimed && p.active && (
                      <button
                        onClick={() => action(p.id, "revoke")}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: "rgba(220,38,38,0.1)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
