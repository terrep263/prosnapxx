"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Copy, CheckCircle, XCircle, RefreshCw,
  Gift, RotateCcw, Plus, X, ExternalLink, Loader2
} from "lucide-react";

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
  created_at: string;
};

type CreatedPromo = {
  id: string;
  subdomain: string;
  token: string;
};

const APP_HOST = "snapworxxpro.com";

function claimUrl(token: string) {
  return `https://${APP_HOST}/claim/${token}`;
}

function dashboardUrl(subdomain: string) {
  return `https://${subdomain}.${APP_HOST}/tenant`;
}

export default function PromosPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createLabel, setCreateLabel] = useState("");
  const [createCount, setCreateCount] = useState(1);
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<CreatedPromo[]>([]);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/promos");
    if (res.ok) setPromos(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function action(id: string, act: "revoke" | "restore" | "reset") {
    if (act === "reset") {
      if (!confirm("Reset this account? The current owner loses access and a new claim link is generated.")) return;
    }
    setActionLoading(`${id}-${act}`);
    const res = await fetch("/api/admin/promos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: act }),
    });
    setActionLoading(null);
    if (res.ok) {
      showToast(
        act === "revoke" ? "Account revoked" :
        act === "restore" ? "Account restored" :
        "Account reset — new claim link generated"
      );
      load();
    } else {
      showToast("Action failed", false);
    }
  }

  async function createPromos() {
    setCreating(true);
    setJustCreated([]);
    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: createLabel.trim() || undefined, count: createCount }),
    });
    setCreating(false);
    if (res.ok) {
      const data = await res.json();
      setJustCreated(data.created ?? []);
      showToast(`${data.created?.length ?? 0} promo account${data.created?.length === 1 ? "" : "s"} created`);
      load();
    } else {
      showToast("Failed to create promo accounts", false);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreateLabel("");
    setCreateCount(1);
    setJustCreated([]);
  }

  const claimed = promos.filter((p) => p.promo_claimed).length;
  const available = promos.filter((p) => p.active && !p.promo_claimed).length;
  const revoked = promos.filter((p) => !p.active).length;

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg transition-all"
          style={{
            background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)",
            color: toast.ok ? "#86efac" : "#fca5a5",
            border: `1px solid ${toast.ok ? "rgba(34,197,94,0.3)" : "rgba(220,38,38,0.3)"}`,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-1 text-sm transition-opacity hover:opacity-70"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">Promo Accounts</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 2px 12px rgba(83,7,146,0.4)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Create Promo
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Available", value: available, color: "#86efac" },
            { label: "Claimed", value: claimed, color: "#c084fc" },
            { label: "Revoked", value: revoked, color: "#fca5a5" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Promo list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(83,7,146,0.2)", border: "1px solid rgba(83,7,146,0.3)" }}
            >
              <Gift className="h-8 w-8" style={{ color: "#c084fc" }} />
            </div>
            <div>
              <p className="font-semibold text-white">No promo accounts yet</p>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Click <strong>Create Promo</strong> to generate your first accounts.
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
            >
              <Plus className="h-4 w-4" /> Create Promo Accounts
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map((p) => {
              const isRevoked = !p.active;
              const isClaimed = p.promo_claimed;
              const borderColor = isRevoked
                ? "rgba(220,38,38,0.2)"
                : isClaimed
                ? "rgba(83,7,146,0.3)"
                : "rgba(34,197,94,0.2)";
              const iconBg = isRevoked
                ? "rgba(220,38,38,0.15)"
                : isClaimed
                ? "rgba(83,7,146,0.3)"
                : "rgba(34,197,94,0.15)";
              const iconColor = isRevoked ? "#fca5a5" : isClaimed ? "#c084fc" : "#86efac";
              const statusLabel = isRevoked ? "Revoked" : isClaimed ? "Claimed" : "Available";
              const statusBg = isRevoked
                ? "rgba(220,38,38,0.15)"
                : isClaimed
                ? "rgba(83,7,146,0.2)"
                : "rgba(34,197,94,0.15)";

              return (
                <div
                  key={p.id}
                  className="rounded-2xl px-5 py-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${borderColor}` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Left — info */}
                    <div className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: iconBg }}
                      >
                        <Gift className="h-4 w-4" style={{ color: iconColor }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {p.subdomain}.{APP_HOST}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ background: statusBg, color: iconColor }}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {isClaimed && p.promo_claimed_by_email ? (
                          <div className="mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {p.promo_claimed_by_email} · {new Date(p.promo_claimed_at!).toLocaleDateString()}
                          </div>
                        ) : !isClaimed && !isRevoked ? (
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className="max-w-[260px] truncate rounded-lg px-2 py-1 text-xs font-mono"
                              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}
                            >
                              {claimUrl(p.promo_claim_token)}
                            </span>
                          </div>
                        ) : null}

                        {isClaimed && (
                          <a
                            href={dashboardUrl(p.subdomain)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                            style={{ color: "rgba(255,255,255,0.35)" }}
                          >
                            <ExternalLink className="h-3 w-3" /> View dashboard
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right — actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Copy claim link — only if unclaimed and active */}
                      {!isClaimed && p.active && (
                        <button
                          onClick={() => copyText(claimUrl(p.promo_claim_token), `claim-${p.id}`)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "rgba(83,7,146,0.2)", color: "#c084fc", border: "1px solid rgba(83,7,146,0.3)" }}
                        >
                          {copied === `claim-${p.id}` ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === `claim-${p.id}` ? "Copied!" : "Copy Link"}
                        </button>
                      )}

                      {/* Copy dashboard link — if claimed */}
                      {isClaimed && p.active && (
                        <button
                          onClick={() => copyText(dashboardUrl(p.subdomain), `dash-${p.id}`)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                          {copied === `dash-${p.id}` ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === `dash-${p.id}` ? "Copied!" : "Copy Dashboard"}
                        </button>
                      )}

                      {/* Reset — claimed accounts */}
                      {isClaimed && (
                        <button
                          onClick={() => action(p.id, "reset")}
                          disabled={actionLoading === `${p.id}-reset`}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                          style={{ background: "rgba(245,158,11,0.1)", color: "#fcd34d", border: "1px solid rgba(245,158,11,0.2)" }}
                        >
                          {actionLoading === `${p.id}-reset`
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RotateCcw className="h-3.5 w-3.5" />}
                          Reset
                        </button>
                      )}

                      {/* Revoke — active accounts */}
                      {p.active && (
                        <button
                          onClick={() => action(p.id, "revoke")}
                          disabled={actionLoading === `${p.id}-revoke`}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                          style={{ background: "rgba(220,38,38,0.1)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.2)" }}
                        >
                          {actionLoading === `${p.id}-revoke`
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <XCircle className="h-3.5 w-3.5" />}
                          Revoke
                        </button>
                      )}

                      {/* Restore — revoked accounts */}
                      {isRevoked && (
                        <button
                          onClick={() => action(p.id, "restore")}
                          disabled={actionLoading === `${p.id}-restore`}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#86efac", border: "1px solid rgba(34,197,94,0.2)" }}
                        >
                          {actionLoading === `${p.id}-restore`
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle className="h-3.5 w-3.5" />}
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Promo Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeCreate(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: "#1a0035", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create Promo Accounts</h2>
              <button
                onClick={closeCreate}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:opacity-70"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {justCreated.length === 0 ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Label <span style={{ color: "rgba(255,255,255,0.3)" }}>(optional — used in subdomain)</span>
                    </label>
                    <input
                      type="text"
                      value={createLabel}
                      onChange={(e) => setCreateLabel(e.target.value)}
                      placeholder="e.g. dj, photographer, wedding"
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                    />
                    {createLabel && (
                      <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Subdomains will look like: <span style={{ color: "#c084fc" }}>{createLabel.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16)}-xxxx.{APP_HOST}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                      Number of accounts <span style={{ color: "rgba(255,255,255,0.3)" }}>(1–20)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCreateCount((c) => Math.max(1, c - 1))}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white transition-all hover:opacity-80"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xl font-bold text-white">{createCount}</span>
                      <button
                        onClick={() => setCreateCount((c) => Math.min(20, c + 1))}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white transition-all hover:opacity-80"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div
                    className="rounded-xl px-4 py-3 text-xs"
                    style={{ background: "rgba(83,7,146,0.15)", border: "1px solid rgba(83,7,146,0.25)", color: "rgba(255,255,255,0.5)" }}
                  >
                    Each account gets a <strong style={{ color: "#c084fc" }}>Pro plan</strong> with 10 events/month and 10 GB storage. Recipients claim their account via a unique link — no payment required.
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={closeCreate}
                    className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPromos}
                    disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 16px rgba(83,7,146,0.4)" }}
                  >
                    {creating ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                    ) : (
                      <><Gift className="h-4 w-4" /> Create {createCount} Account{createCount > 1 ? "s" : ""}</>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success state — show created accounts with copy links */
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" style={{ color: "#86efac" }} />
                  <span className="text-sm font-semibold" style={{ color: "#86efac" }}>
                    {justCreated.length} account{justCreated.length > 1 ? "s" : ""} created
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {justCreated.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{c.subdomain}.{APP_HOST}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {claimUrl(c.token)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyText(claimUrl(c.token), `new-${c.id}`)}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(83,7,146,0.2)", color: "#c084fc", border: "1px solid rgba(83,7,146,0.3)" }}
                      >
                        {copied === `new-${c.id}` ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === `new-${c.id}` ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={closeCreate}
                  className="mt-5 w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
