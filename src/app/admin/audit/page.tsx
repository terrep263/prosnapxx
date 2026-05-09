"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw } from "lucide-react";

type Log = {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  before_state: object | null;
  after_state: object | null;
  metadata: object;
  admin_users: { name: string; email: string } | null;
};

export default function AuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/audit");
    if (res.ok) setLogs(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0f0020", fontFamily: "'Sora','Inter',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin")} className="flex items-center gap-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            <span className="text-sm font-semibold text-white">Audit Log</span>
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-2">
          {loading ? (
            <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading logs…</div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No audit logs yet.</div>
          ) : logs.map((log) => (
            <div
              key={log.id}
              className="rounded-xl px-4 py-3 cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              onClick={() => setExpanded(expanded === log.id ? null : log.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ background: "rgba(83,7,146,0.3)", color: "#c084fc" }}
                  >
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="truncate text-sm text-white">
                    {log.admin_users?.name ?? "Unknown"}
                  </span>
                  {log.entity_type && (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}…` : ""}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              {expanded === log.id && (log.before_state || log.after_state || log.metadata) && (
                <div className="mt-3 space-y-2">
                  {log.before_state && (
                    <div>
                      <div className="mb-1 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>Before</div>
                      <pre className="overflow-x-auto rounded-lg p-3 text-xs" style={{ background: "rgba(0,0,0,0.3)", color: "#c084fc" }}>
                        {JSON.stringify(log.before_state, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.after_state && (
                    <div>
                      <div className="mb-1 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>After</div>
                      <pre className="overflow-x-auto rounded-lg p-3 text-xs" style={{ background: "rgba(0,0,0,0.3)", color: "#86efac" }}>
                        {JSON.stringify(log.after_state, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
