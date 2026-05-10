"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Gift, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"form" | "success" | "invalid">("form");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");

  const pwMatch = password === confirm;
  const pwStrong = password.length >= 8;
  const canSubmit = businessName.trim().length >= 2 && ownerEmail.includes("@") && pwStrong && pwMatch && !loading;

  async function claim() {
    setError("");
    if (!pwMatch) { setError("Passwords do not match."); return; }
    if (!pwStrong) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, businessName: businessName.trim(), ownerEmail: ownerEmail.trim(), password }),
      });

      const data = await res.json();

      if (res.status === 404) { setStep("invalid"); return; }
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }

      setSubdomain(data.subdomain);
      setDashboardUrl(data.dashboardUrl);
      setStep("success");

      // Auto-redirect after 2.5 seconds
      setTimeout(() => { window.location.href = data.dashboardUrl; }, 2500);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #1a0030 0%, #2d0057 100%)", fontFamily: "'Sora','Inter',sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="w-full max-w-md">

        {/* ── Invalid / expired ── */}
        {step === "invalid" && (
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-white">Link Invalid or Expired</h1>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              This claim link has already been used, revoked, or does not exist.
              Contact the person who sent you this link for a new one.
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <div className="text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 8px 40px rgba(83,7,146,0.6)" }}
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Your account is ready! 🎉</h1>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your branded gallery platform is live at:
            </p>
            <p className="mt-2 font-bold" style={{ color: "#c084fc" }}>
              {subdomain}.snapworxxpro.com
            </p>
            <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Taking you to your dashboard…
            </p>
            <div className="mt-3 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#c084fc" }} />
            </div>
            <a
              href={dashboardUrl}
              className="mt-6 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 20px rgba(83,7,146,0.4)" }}
            >
              Go to dashboard →
            </a>
            <p className="mt-5 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Bookmark your dashboard. Log in at any time with your email and password.
            </p>
          </div>
        )}

        {/* ── Claim form ── */}
        {step === "form" && (
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <div
                className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-2xl"
                style={{
                  width: 72, height: 72,
                  background: "linear-gradient(135deg, #530792, #7c3aed)",
                  boxShadow: "0 8px 32px rgba(83,7,146,0.5)"
                }}
              >
                <Gift className="h-9 w-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Claim Your Free Account</h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Set up your branded photo gallery platform — no credit card needed.
              </p>
            </div>

            {/* Form card */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="space-y-4">

                {/* Business name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Photography Co."
                    autoComplete="organization"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: `1px solid ${businessName.length >= 2 ? "rgba(83,7,146,0.5)" : "rgba(255,255,255,0.15)"}`,
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    autoComplete="email"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: `1px solid ${ownerEmail.includes("@") ? "rgba(83,7,146,0.5)" : "rgba(255,255,255,0.15)"}`,
                    }}
                  />
                  <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    This will be your login email. Use one you check regularly.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                      className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white outline-none transition-all"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: `1px solid ${pwStrong ? "rgba(83,7,146,0.5)" : "rgba(255,255,255,0.15)"}`,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: `1px solid ${confirm && !pwMatch ? "rgba(220,38,38,0.5)" : confirm && pwMatch ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.15)"}`,
                    }}
                  />
                  {confirm && !pwMatch && (
                    <p className="mt-1 text-xs" style={{ color: "#fca5a5" }}>Passwords do not match.</p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ background: "rgba(220,38,38,0.15)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.3)" }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={claim}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: canSubmit ? "0 4px 16px rgba(83,7,146,0.4)" : "none" }}
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up your account…</>
                    : "Claim My Account →"}
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              Powered by SnapWorxx Pro · No credit card required
            </p>
          </>
        )}
      </div>
    </div>
  );
}
