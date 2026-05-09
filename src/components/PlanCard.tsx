"use client";

import { Check } from "lucide-react";
import type { PlanDefinition } from "@/lib/types";
import { TenantButton } from "@/components/TenantButton";

type Props = {
  plan: PlanDefinition;
  interval: "monthly" | "yearly";
  isSelected: boolean;
  onSelect: () => void;
};

export function PlanCard({ plan, interval, isSelected, onSelect }: Props) {
  const price = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  const suffix = interval === "monthly" ? "/mo" : "/yr";

  return (
    <article className={`rounded-lg border bg-white p-5 ${isSelected ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-gray-200"}`}>
      <div className="flex min-h-36 flex-col">
        <h3 className="text-xl font-semibold text-gray-950">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-600">{plan.recommendation}</p>
        <div className="mt-5">
          <span className="text-3xl font-bold text-gray-950">${price}</span>
          <span className="text-sm text-gray-500">{suffix}</span>
        </div>
      </div>
      <ul className="mt-5 space-y-3 text-sm text-gray-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <TenantButton type="button" variant={isSelected ? "primary" : "secondary"} className="mt-6 w-full" onClick={onSelect}>
        {isSelected ? "Selected" : "Choose plan"}
      </TenantButton>
    </article>
  );
}
