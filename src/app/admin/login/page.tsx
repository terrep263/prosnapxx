"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    setLoading(false);

    if (!res.ok) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/admin");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1a0030 0%, #2d0057 100%)", fontFamily: "'Sora', 'Inter', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 8px 32px rgba(83,7,146,0.5)" }}
          >
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>SnapWorxx Pro</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                placeholder="admin@snapworxxpro.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(220,38,38,0.15)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.3)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 mt-2"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 16px rgba(83,7,146,0.4)" }}
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          Restricted access · SnapWorxx Pro Admin
        </p>
      </div>
    </div>
  );
}
