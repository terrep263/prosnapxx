"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Gift, CheckCircle } from "lucide-react";

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"form" | "success" | "invalid">("form");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState("");

  async function claim() {
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, businessName, ownerEmail, password })
    });
    setLoading(false);

    if (res.ok) {
      const data = await res.json();
      setSubdomain(data.subdomain);
      setStep("success");
      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = data.dashboardUrl;
      }, 2000);
    } else {
      const err = await res.json();
      if (res.status === 404) setStep("invalid");
      else setError(err.error ?? "Something went wrong.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1a0030 0%, #2d0057 100%)", fontFamily: "'Sora','Inter',sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      <div className="w-full max-w-md">
        {step === "invalid" && (
          <div className="text-center">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-white">Link Invalid or Expired</h1>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              This claim link has already been used or is no longer valid.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Your account is ready! 🎉</h1>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              Your branded gallery platform is live at:
            </p>
            <a
              href={`https://${subdomain}.snapworxxpro.com/login`}
              className="mt-4 inline-block rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 20px rgba(83,7,146,0.4)" }}
            >
              Go to {subdomain}.snapworxxpro.com →
            </a>
            <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Bookmark your dashboard link. Log in with the email and password you just set.
            </p>
          </div>
        )}

        {step === "form" && (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 8px 32px rgba(83,7,146,0.5)" }}>
                <Gift className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Claim Your Free Account</h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Set up your branded photo gallery platform — no credit card needed.
              </p>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div className="space-y-4">
                {[
                  { label: "Business Name", value: businessName, set: setBusinessName, type: "text", placeholder: "Your Photography Co." },
                  { label: "Your Email", value: ownerEmail, set: setOwnerEmail, type: "email", placeholder: "you@yourbusiness.com" },
                  { label: "Password", value: password, set: setPassword, type: "password", placeholder: "Min 8 characters" },
                  { label: "Confirm Password", value: confirm, set: setConfirm, type: "password", placeholder: "Repeat password" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{f.label}</label>
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                    />
                  </div>
                ))}

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: "rgba(220,38,38,0.15)", color: "#fca5a5", border: "1px solid rgba(220,38,38,0.3)" }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={claim}
                  disabled={loading || !businessName || !ownerEmail || !password || !confirm}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 16px rgba(83,7,146,0.4)" }}
                >
                  {loading ? "Setting up your account…" : "Claim My Account →"}
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Powered by SnapWorxx Pro
            </p>
          </>
        )}
      </div>
    </div>
  );
}
