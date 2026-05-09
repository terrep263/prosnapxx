"use client";

import { useEffect, useMemo, useState } from "react";
import { PlanCard } from "@/components/PlanCard";
import { TenantButton } from "@/components/TenantButton";
import { useToast } from "@/components/Toast";
import { planDefinitions } from "@/lib/config";
import { sanitizeSubdomain } from "@/lib/slug";
import type { BillingInterval, PlanKey } from "@/lib/types";

export function SignupFlow() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [plan, setPlan] = useState<PlanKey>("starter");
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(() => planDefinitions.find((item) => item.key === plan) ?? planDefinitions[0], [plan]);

  useEffect(() => {
    if (!subdomain || subdomain.length < 3) {
      setAvailable(null);
      return;
    }
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

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-950">Create your branded photo-sharing workspace</h1>
          <p className="mt-2 text-gray-600">Choose a plan, reserve a subdomain, and finish setup through secure checkout.</p>
        </div>

        <div className="mb-8 flex gap-2 rounded-md border border-gray-200 bg-white p-1 text-sm">
          {[1, 2, 3].map((item) => (
            <div key={item} className={`flex-1 rounded px-3 py-2 text-center font-medium ${step === item ? "bg-brand-primary text-white" : "text-gray-600"}`}>
              Step {item}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <>
            <div className="mb-5 inline-flex rounded-md border border-gray-200 bg-white p-1">
              <button className={`rounded px-4 py-2 text-sm font-semibold ${interval === "monthly" ? "bg-gray-950 text-white" : "text-gray-700"}`} onClick={() => setInterval("monthly")}>
                Monthly
              </button>
              <button className={`rounded px-4 py-2 text-sm font-semibold ${interval === "yearly" ? "bg-gray-950 text-white" : "text-gray-700"}`} onClick={() => setInterval("yearly")}>
                Annual
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {planDefinitions.map((item) => (
                <PlanCard key={item.key} plan={item} interval={interval} isSelected={plan === item.key} onSelect={() => setPlan(item.key)} />
              ))}
            </div>
            <TenantButton className="mt-6" onClick={() => setStep(2)}>
              Continue
            </TenantButton>
          </>
        ) : null}

        {step === 2 ? (
          <section className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-950">Business details</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Business name
                <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Owner email
                <input className="focus-ring rounded-md border border-gray-300 px-3 py-2" type="email" value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-gray-700">
                Subdomain
                <input
                  className="focus-ring rounded-md border border-gray-300 px-3 py-2"
                  value={subdomain}
                  onChange={(event) => setSubdomain(sanitizeSubdomain(event.target.value))}
                  placeholder="yourbrand"
                />
                <span className={available ? "text-[#530792]" : available === false ? "text-red-600" : "text-gray-500"}>
                  {available === null ? "Use 3-30 lowercase letters, numbers, or hyphens." : available ? "Subdomain is available." : "Subdomain is not available."}
                </span>
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <TenantButton variant="secondary" onClick={() => setStep(1)}>
                Back
              </TenantButton>
              <TenantButton disabled={!businessName || !ownerEmail || available !== true} onClick={() => setStep(3)}>
                Continue
              </TenantButton>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-950">Start {selectedPlan.name}</h2>
            <p className="mt-2 text-gray-600">
              {businessName} will use the {selectedPlan.name} plan at ${interval === "monthly" ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice}
              {interval === "monthly" ? "/mo" : "/yr"}.
            </p>
            <div className="mt-6 flex gap-3">
              <TenantButton variant="secondary" onClick={() => setStep(2)}>
                Back
              </TenantButton>
              <TenantButton disabled={loading} onClick={checkout}>
                {loading ? "Starting checkout" : "Continue to Checkout"}
              </TenantButton>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
