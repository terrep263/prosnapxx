"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
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
    const supabase = createBrowserSupabaseClient();
    const result = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    window.location.href = next;
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-gray-950">Owner login</h1>
      <div className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Email
          <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="grid gap-2 text-sm font-medium text-gray-700">
          Password
          <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
      </div>
      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <TenantButton className="mt-6 w-full" disabled={loading}>
        {loading ? "Signing in" : "Sign in"}
      </TenantButton>
    </form>
  );
}
