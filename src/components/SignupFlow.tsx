"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";
import { planDefinitions } from "@/lib/config";
import { sanitizeSubdomain } from "@/lib/slug";
import { Check } from "lucide-react";
import type { BillingInterval, PlanKey } from "@/lib/types";

export function SignupFlow() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [plan, setPlan] = useState<PlanKey>("pro");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(() => planDefinitions.find((item) => item.key === plan) ?? planDefinitions[1], [plan]);

  useEffect(() => {
    if (!subdomain || subdomain.length < 3) { setAvailable(null); return; }
    const handle = setTimeout(async () => {
      const response = await fetch(`/api/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);
      if (response.ok) {
        const payload = (await response.json()) as { available: boolean };
        setAvailable(payload.available);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [subdomain]);

  async function checkout() {
    setLoading(true);
    const response = await fetch("/api/checkout/tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval, businessName, ownerEmail, subdomain })
    });
    setLoading(false);
    if (!response.ok) {
      toast("Checkout could not be started. Please review your details.", "error");
      return;
    }
    const payload = (await response.json()) as { url: string };
    window.location.href = payload.url;
  }

  const steps = ["Choose your plan", "Business details", "Checkout"];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="text-lg font-bold" style={{ color: "#530792" }}>SnapWorxx Pro</div>
          <div className="text-sm text-gray-500">7-day free trial · Cancel anytime</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">

        {/* Step indicators */}
        <div className="mb-10 flex items-center justify-center gap-0">
          {steps.map((label, i) => {
            const num = i + 1;
            const active = step === num;
            const done = step > num;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: active || done ? "linear-gradient(135deg, #530792, #7c3aed)" : "#f3f4f6",
                      color: active || done ? "#fff" : "#9ca3af"
                    }}
                  >
                    {done ? <Check className="h-4 w-4" /> : num}
                  </div>
                  <span className="mt-1 text-xs font-medium" style={{ color: active ? "#530792" : "#9ca3af" }}>{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="mb-4 mx-3 h-px w-16 sm:w-24" style={{ background: step > num ? "#530792" : "#e5e7eb" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Plan selection */}
        {step === 1 && (
          <div>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-950">Choose your plan</h1>
              <p className="mt-2 text-gray-500">All plans include a 7-day free trial. Card required.</p>
            </div>

            <div className="mb-6 flex justify-center">
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button
                  className="rounded-lg px-5 py-2 text-sm font-semibold transition-all"
                  style={interval === "monthly" ? { background: "linear-gradient(135deg, #530792, #7c3aed)", color: "#fff" } : { color: "#6b7280" }}
                  onClick={() => setInterval("monthly")}
                >
                  Monthly
                </button>
                <button
                  className="rounded-lg px-5 py-2 text-sm font-semibold transition-all"
                  style={interval === "yearly" ? { background: "linear-gradient(135deg, #530792, #7c3aed)", color: "#fff" } : { color: "#6b7280" }}
                  onClick={() => setInterval("yearly")}
                >
                  Annual <span className="ml-1 text-xs opacity-75">2 months free</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {planDefinitions.map((item) => {
                const isSelected = plan === item.key;
                const isPopular = item.key === "pro";
                return (
                  <div
                    key={item.key}
                    onClick={() => setPlan(item.key)}
                    className="relative cursor-pointer rounded-2xl border-2 p-6 transition-all"
                    style={{
                      borderColor: isSelected ? "#530792" : "#e5e7eb",
                      background: isSelected ? "linear-gradient(160deg, #faf5ff, #f3e8ff)" : "#fff",
                      boxShadow: isSelected ? "0 4px 24px rgba(83,7,146,0.15)" : "0 1px 4px rgba(0,0,0,0.05)"
                    }}
                  >
                    {isPopular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
                      >
                        Most Popular
                      </div>
                    )}
                    <div className="text-sm font-semibold" style={{ color: "#530792" }}>{item.name}</div>
                    <div className="mt-2 text-3xl font-extrabold text-gray-950">
                      ${interval === "monthly" ? item.monthlyPrice : item.yearlyPrice}
                      <span className="text-base font-normal text-gray-400">{interval === "monthly" ? "/mo" : "/yr"}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{item.recommendation}</div>
                    <ul className="mt-4 space-y-2">
                      {item.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#530792" }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isSelected && (
                      <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold" style={{ color: "#530792" }}>
                        <Check className="h-3.5 w-3.5" /> Selected
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setStep(2)}
                className="inline-flex h-12 items-center justify-center rounded-xl px-10 text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 20px rgba(83,7,146,0.35)" }}
              >
                Continue with {selectedPlan.name} →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Business details */}
        {step === 2 && (
          <div className="mx-auto max-w-lg">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-950">Business details</h1>
              <p className="mt-2 text-gray-500">This is how your workspace will be set up.</p>
            </div>

            <div
              className="rounded-2xl border p-8"
              style={{ borderColor: "rgba(83,7,146,0.15)", boxShadow: "0 4px 24px rgba(83,7,146,0.08)" }}
            >
              {/* Plan summary */}
              <div
                className="mb-6 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
                style={{ background: "linear-gradient(135deg, #faf5ff, #f3e8ff)", border: "1px solid rgba(83,7,146,0.15)" }}
              >
                <span className="font-semibold text-gray-700">{selectedPlan.name} plan</span>
                <span className="font-bold" style={{ color: "#530792" }}>
                  ${interval === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice}
                  {interval === "monthly" ? "/mo" : "/yr"}
                </span>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Business name</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your Photography Co."
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Owner email</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-gray-700">Subdomain</span>
                  <div className="mt-1.5 flex items-center rounded-xl border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all overflow-hidden">
                    <input
                      className="flex-1 px-4 py-3 text-sm outline-none bg-white"
                      value={subdomain}
                      onChange={(e) => setSubdomain(sanitizeSubdomain(e.target.value))}
                      placeholder="yourbrand"
                    />
                    <span className="bg-gray-50 px-3 py-3 text-xs text-gray-400 border-l border-gray-200">.snapworxxpro.com</span>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: available === true ? "#530792" : available === false ? "#dc2626" : "#9ca3af" }}>
                    {available === null ? "3–30 lowercase letters, numbers, or hyphens." : available ? "✓ Subdomain is available." : "✗ Subdomain is not available."}
                  </p>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  disabled={!businessName || !ownerEmail || available !== true}
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
                >
                  Continue →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Review & Checkout */}
        {step === 3 && (
          <div className="mx-auto max-w-lg">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-950">Review & checkout</h1>
              <p className="mt-2 text-gray-500">You won&apos;t be charged until your 7-day trial ends.</p>
            </div>

            <div
              className="rounded-2xl border p-8"
              style={{ borderColor: "rgba(83,7,146,0.15)", boxShadow: "0 4px 24px rgba(83,7,146,0.08)" }}
            >
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Business</span>
                  <span className="font-semibold text-gray-950">{businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-semibold text-gray-950">{ownerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subdomain</span>
                  <span className="font-semibold" style={{ color: "#530792" }}>{subdomain}.snapworxxpro.com</span>
                </div>
                <div className="my-2 border-t border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-gray-950">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Billing</span>
                  <span className="font-semibold text-gray-950">{interval === "monthly" ? "Monthly" : "Annual"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount after trial</span>
                  <span className="text-lg font-extrabold" style={{ color: "#530792" }}>
                    ${interval === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice}
                    <span className="text-sm font-normal text-gray-400">{interval === "monthly" ? "/mo" : "/yr"}</span>
                  </span>
                </div>
                <div
                  className="mt-2 rounded-xl px-4 py-3 text-xs text-center font-medium"
                  style={{ background: "#faf5ff", color: "#530792" }}
                >
                  🎉 7-day free trial starts today. Card required but not charged until trial ends.
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
                <button
                  disabled={loading}
                  onClick={checkout}
                  className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 16px rgba(83,7,146,0.35)" }}
                >
                  {loading ? "Starting checkout…" : "Continue to Payment →"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
