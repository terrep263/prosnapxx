"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { TenantButton } from "@/components/TenantButton";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/tenant";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/owner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json();
      setError(err.error ?? "Invalid email or password.");
      return;
    }

    window.location.href = next;
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-950">Owner login</h1>
      <p className="mt-1 text-sm text-gray-500">Sign in to your branded gallery dashboard.</p>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Email
          <input
            className="focus-ring rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourbusiness.com"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-gray-700">
          Password
          <input
            className="focus-ring rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
      </div>
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <TenantButton className="mt-6 w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </TenantButton>
    </form>
  );
}
