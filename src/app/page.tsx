import Image from "next/image";
import Link from "next/link";
import { Camera, Share2, Download, Check, X, Zap, Building2, Users } from "lucide-react";
import { getTenant } from "@/lib/server-tenant";

const steps = [
  {
    icon: Camera,
    step: "01",
    title: "Pick your plan and set up your brand",
    description: "Upload your logo, set your brand colors, and claim your subdomain — or point your own domain. Setup takes minutes, not months.",
  },
  {
    icon: Share2,
    step: "02",
    title: "Create events for your clients",
    description: "Log into your private dashboard and create a new event in seconds. Each event gets a unique QR code and shareable link — all branded to you.",
  },
  {
    icon: Zap,
    step: "03",
    title: "Guests upload. You own the gallery.",
    description: "Guests scan the QR code — no app download required — and upload photos directly to your branded gallery.",
  },
  {
    icon: Download,
    step: "04",
    title: "Download, share, deliver",
    description: "Bulk download as ZIP, share the gallery link, or let guests browse on their own. Your client never sees what's running under the hood.",
  },
];

const audiences = [
  {
    icon: Camera,
    title: "Solo Photographers & Freelancers",
    description: "Stop sending clients to a platform that competes with you. Own the experience from start to finish.",
  },
  {
    icon: Building2,
    title: "Boutique Event Planning Agencies",
    description: "Add a premium photo-sharing service to your offerings without hiring a developer or licensing expensive software.",
  },
  {
    icon: Users,
    title: "Corporate Events & HR Teams",
    description: "Run branded photo experiences for conferences, retreats, and activations. Keep everything on your domain, in your brand identity.",
  },
];

type PlanFeature = {
  label: string;
  starter: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
  agency: string | boolean;
};

const planFeatures: PlanFeature[] = [
  { label: "Best for", starter: "Solo / Freelancer", pro: "Active Freelancer", studio: "Small Agency (3–10)", agency: "Mid Agency (11–50)" },
  { label: "Monthly", starter: "$29/mo", pro: "$49/mo", studio: "$99/mo", agency: "$199/mo" },
  { label: "Annual", starter: "$290/yr", pro: "$490/yr", studio: "$990/yr", agency: "$1,990/yr" },
  { label: "Events / month", starter: "3", pro: "10", studio: "30", agency: "Unlimited" },
  { label: "Storage", starter: "5 GB", pro: "10 GB", studio: "50 GB", agency: "200 GB" },
  { label: "Custom domain", starter: false, pro: false, studio: true, agency: true },
  { label: "Your branding", starter: true, pro: true, studio: true, agency: true },
  { label: "No SnapWorxx badge", starter: false, pro: false, studio: true, agency: true },
];

const plans = ["Starter", "Pro", "Studio", "Agency"];

function FeatureCell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`mx-auto h-5 w-5 ${highlight ? "text-white" : "text-brand-primary"}`} />
    ) : (
      <X className="mx-auto h-5 w-5 text-gray-300" />
    );
  }
  return <span className={highlight ? "font-semibold text-white" : ""}>{value}</span>;
}

export default async function HomePage() {
  await getTenant();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-up { animation: fadeUp 0.7s ease forwards; }
        .animate-fade-up-delay-1 { animation: fadeUp 0.7s 0.15s ease forwards; opacity: 0; }
        .animate-fade-up-delay-2 { animation: fadeUp 0.7s 0.3s ease forwards; opacity: 0; }
        .animate-fade-up-delay-3 { animation: fadeUp 0.7s 0.45s ease forwards; opacity: 0; }
        .animate-fade-in { animation: fadeIn 0.9s ease forwards; }
        .step-card:hover { transform: translateY(-4px); transition: transform 0.25s ease; }
        .audience-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(83,7,146,0.12); transition: all 0.25s ease; }
        .plan-col-highlight { background: linear-gradient(160deg, #530792, #7c3aed); }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6" style={{ overflow: "visible" }}>
          <Image src="/PROlogo.png" alt="SnapWorxx PRO" width={252} height={56} className="w-auto" style={{ height: "52px" }} />
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-950 transition-colors">
              Owner login
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section
          className="relative text-center"
          style={{
            backgroundImage: "url(/headerbackground.png)",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            aspectRatio: "16/9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,0,20,0.55) 0%, rgba(10,0,20,0.35) 60%, rgba(10,0,20,0.6) 100%)" }} />

          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 animate-fade-in">
            <span
              className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "rgba(255,255,255,0.15)", color: "#e9d5ff", border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}
            >
              White-label event photo sharing
            </span>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)", lineHeight: 1.1 }}>
              Finally — Your Brand.<br />Your Gallery.<br />Your Business.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg font-light" style={{ color: "rgba(255,255,255,0.8)" }}>
              SnapWorxx Pro turns our proven event photo platform into your own branded experience — no coding, no developers, no compromises.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up-delay-2">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl px-8 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 4px 24px rgba(83,7,146,0.5)" }}
              >
                Start Your 7-Day Trial →
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border px-6 text-sm font-semibold transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.9)" }}
              >
                Owner login
              </Link>
            </div>
            <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              7-day free trial · Card required · Cancel anytime
            </p>
          </div>
        </section>

        {/* What Is SnapWorxx Pro — dark band */}
        <section style={{ background: "linear-gradient(135deg, #1a0030 0%, #2d0057 100%)" }} className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c084fc" }}>What Is SnapWorxx Pro?</span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Your logo. Your colors. Your domain.<br />
              <span style={{ color: "#c084fc" }}>Your clients never see SnapWorxx.</span>
            </h2>
            <p className="mt-6 text-lg font-light" style={{ color: "rgba(255,255,255,0.65)" }}>
              SnapWorxx Pro is a white-label subscription that lets you run a fully branded photo-sharing platform under your own name. Whether you&apos;re a solo event photographer, a boutique planning agency, or a mid-size corporate events firm — enterprise-level technology at a fraction of the cost of building it yourself.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">How It Works</span>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">Four steps. Zero developers.</h2>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step) => (
                <div
                  key={step.step}
                  className="step-card group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                  style={{ transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
                  >
                    <step.icon className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className="absolute top-5 right-5 text-5xl font-black"
                    style={{ color: "rgba(83,7,146,0.06)", lineHeight: 1 }}
                  >
                    {step.step}
                  </div>
                  <span className="mt-5 block text-xs font-bold uppercase tracking-widest text-brand-primary">
                    Step {step.step}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-gray-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's Built For */}
        <section className="py-24" style={{ background: "linear-gradient(180deg, #faf5ff 0%, #f3e8ff 100%)" }}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Who It&apos;s Built For</span>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">Built for professionals who own their brand.</h2>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {audiences.map((a) => (
                <div
                  key={a.title}
                  className="audience-card rounded-2xl bg-white p-8"
                  style={{ boxShadow: "0 4px 24px rgba(83,7,146,0.07)", border: "1px solid rgba(83,7,146,0.08)" }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: "linear-gradient(135deg, #530792, #7c3aed)" }}
                  >
                    <a.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-gray-950">{a.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Pricing</span>
              <h2 className="mt-3 text-3xl font-bold text-gray-950 sm:text-4xl">Plans built around your team size.</h2>
              <p className="mt-3 text-gray-500">Annual plans include 2 months free.</p>
            </div>
            <div className="mt-14 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="py-4 pr-8 text-left font-normal text-gray-400 w-44"></th>
                    {plans.map((plan, i) => (
                      <th
                        key={plan}
                        className={`px-5 py-4 text-center font-bold ${i === 1 ? "plan-col-highlight text-white rounded-t-2xl" : "text-gray-950"}`}
                      >
                        <div>{plan}</div>
                        {i === 1 && (
                          <div className="mt-1">
                            <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                              Most Popular
                            </span>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planFeatures.map((feature, idx) => (
                    <tr
                      key={feature.label}
                      className={idx % 2 === 0 ? "bg-gray-50/80" : "bg-white"}
                    >
                      <td className="py-3.5 pr-8 font-medium text-gray-700">{feature.label}</td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        <FeatureCell value={feature.starter} />
                      </td>
                      <td className="px-5 py-3.5 text-center plan-col-highlight">
                        <FeatureCell value={feature.pro} highlight />
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        <FeatureCell value={feature.studio} />
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        <FeatureCell value={feature.agency} />
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-4 pr-8"></td>
                    {plans.map((plan, i) => (
                      <td key={plan} className={`px-5 py-4 text-center ${i === 1 ? "plan-col-highlight rounded-b-2xl" : ""}`}>
                        <Link
                          href="/signup"
                          className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-bold transition-all hover:scale-105 ${
                            i === 1
                              ? "bg-white text-brand-primary"
                              : "border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                          }`}
                        >
                          Get Started
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Your Clients See You — dark */}
        <section style={{ background: "linear-gradient(135deg, #1a0030 0%, #2d0057 100%)" }} className="py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c084fc" }}>The Promise</span>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              Your clients see you.<br />
              <span style={{ color: "#c084fc" }}>Only you.</span>
            </h2>
            <p className="mt-6 text-lg font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
              Every gallery page, every QR code, every confirmation email carries your brand. No SnapWorxx badge. No redirect to our homepage. No upsell to your clients. Just a seamless, professional photo experience — because as far as your clients are concerned, you built it yourself.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-4xl font-extrabold text-gray-950">Ready to make it yours?</h2>
            <p className="mt-4 text-gray-500">No charge for the first 7 days. Card required. Cancel anytime.</p>
            <Link
              href="/signup"
              className="mt-10 inline-flex h-14 items-center justify-center rounded-xl px-10 text-base font-bold text-white shadow-xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #530792, #7c3aed)", boxShadow: "0 8px 32px rgba(83,7,146,0.4)" }}
            >
              Start Your 7-Day Trial →
            </Link>
            <p className="mt-4 text-xs text-gray-400">No hidden fees · Cancel anytime · Setup in minutes</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #f0e6ff" }} className="py-8 text-center">
        <p className="text-xs text-gray-400">Powered by ATLV Solutions</p>
      </footer>
    </div>
  );
}
