"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

type RouteResult = {
  name: string;
  url: string;
  status: number;
  ok: boolean;
  latency: number;
  error?: string;
};

export default function HealthPage() {
  const router = useRouter();
  const [results, setResults] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/health");
    if (res.ok) {
      setResults(await res.json());
      setLastChecked(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 60_000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, [check]);

  const allOk = results.every((r) => r.ok);
  const failCount = results.filter((r) => !r.ok).length;

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">Route Health</span>
          </div>
          <div className="flex items-center gap-3">
            {lastChecked && (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                Last checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={check}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Summary */}
        <div
          className="mb-6 flex items-center gap-4 rounded-2xl p-5"
          style={{
            background: allOk ? "rgba(34,197,94,0.08)" : "rgba(220,38,38,0.08)",
            border: `1px solid ${allOk ? "rgba(34,197,94,0.2)" : "rgba(220,38,38,0.2)"}`
          }}
        >
          {allOk
            ? <CheckCircle className="h-8 w-8 text-green-400 shrink-0" />
            : <XCircle className="h-8 w-8 text-red-400 shrink-0" />
          }
          <div>
            <div className="font-bold text-white">
              {loading ? "Checking routes…" : allOk ? "All systems operational" : `${failCount} route${failCount > 1 ? "s" : ""} failing`}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {results.length} routes monitored · Auto-refreshes every 60s
            </div>
          </div>
        </div>

        {/* Route list */}
        <div className="space-y-3">
          {loading && results.length === 0 ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))
          ) : (
            results.map((r) => (
              <div
                key={r.url}
                className="flex items-center justify-between rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${r.ok ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.3)"}`
                }}
              >
                <div className="flex items-center gap-3">
                  {r.ok
                    ? <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
                    : <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                  }
                  <div>
                    <div className="text-sm font-semibold text-white">{r.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{r.url}</div>
                    {r.error && (
                      <div className="text-xs text-red-400 mt-0.5">{r.error}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <Clock className="h-3.5 w-3.5" />
                    {r.latency}ms
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      background: r.ok ? "rgba(34,197,94,0.15)" : "rgba(220,38,38,0.15)",
                      color: r.ok ? "#86efac" : "#fca5a5"
                    }}
                  >
                    {r.status === 0 ? "TIMEOUT" : r.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
