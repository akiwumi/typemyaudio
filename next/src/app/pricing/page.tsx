"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FloatingNav } from "@/components/layout/floating-nav";
import { Check, X, ArrowRight } from "lucide-react";

const HERO_PHOTO = "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=2400&q=80";

const plans = [
  { name: "Free", price: "€0", period: "", description: "Try it out with 3 lifetime transcriptions", features: [
    { label: "3 total transcriptions (lifetime)", included: true },
    { label: "Auto language detection", included: true },
    { label: "AI grammar cleanup", included: true },
    { label: "Export to TXT, PDF, DOCX", included: true },
    { label: "Cloud storage", included: false },
    { label: "SRT subtitle export", included: false },
    { label: "Sentence-level timecodes", included: false },
  ], cta: "Get Started", tier: "free", popular: false },
  { name: "Starter", price: "€15", period: "/month", description: "For regular users who need more transcriptions", features: [
    { label: "15 transcriptions/month + buy more", included: true },
    { label: "Auto language detection", included: true },
    { label: "AI grammar cleanup & summary", included: true },
    { label: "Export to TXT, PDF, DOCX", included: true },
    { label: "Cloud storage (during subscription)", included: true },
    { label: "SRT subtitle export", included: false },
    { label: "Sentence-level timecodes", included: false },
  ], cta: "Subscribe", tier: "starter", priceId: "price_starter_monthly", popular: true },
  { name: "Annual", price: "€100", period: "/year", description: "Save 44% with annual billing + SRT subtitles", features: [
    { label: "15 transcriptions/month + buy more", included: true },
    { label: "Auto language detection", included: true },
    { label: "AI grammar cleanup & summary", included: true },
    { label: "Export to TXT, PDF, DOCX", included: true },
    { label: "Cloud storage (during subscription)", included: true },
    { label: "SRT subtitle export", included: true },
    { label: "Sentence-level timecodes", included: false },
  ], cta: "Subscribe", tier: "annual", priceId: "price_annual", popular: false },
  { name: "Enterprise", price: "Custom", period: "", description: "For teams and businesses with custom needs", features: [
    { label: "Custom transcription volume", included: true },
    { label: "Auto language detection", included: true },
    { label: "AI grammar cleanup & summary", included: true },
    { label: "Export to TXT, PDF, DOCX", included: true },
    { label: "Custom cloud storage", included: true },
    { label: "SRT subtitle export", included: true },
    { label: "Sentence-level timecodes", included: true },
  ], cta: "Contact Sales", tier: "enterprise", popular: false },
];

export default function PricingPage() {
  const { user, profile } = useAuth();

  async function handleSubscribe(priceId: string) {
    if (!user) {
      window.location.href = "/register";
      return;
    }
    try {
      const { url } = await api.post<{ url: string }>("/api/payments/create-checkout", { priceId });
      if (url) window.location.href = url;
    } catch {
      // error
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      <section className="relative h-[28rem] flex items-end">
        <div className="absolute inset-0">
          <img src={HERO_PHOTO} alt="Professional workspace" className="img-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1B2E] via-[#1A1B2E]/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <span className="label-tag text-white/50 mb-4 inline-block">Pricing</span>
          <h1 className="editorial-display text-[#FACC15] text-4xl md:text-5xl mb-3">
            Simple, <span className="editorial-italic text-primary-light">transparent</span> pricing
          </h1>
          <p className="text-white/60 max-w-lg">
            Choose the plan that fits your workflow. Start free and upgrade when you&apos;re ready.
          </p>
        </div>
      </section>
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.tier} className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-3 shadow-sm">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-foreground-muted">{plan.period}</span>
                </div>
                <p className="text-sm text-foreground-muted mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2 text-sm">
                      {feature.included ? <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> : <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />}
                      <span className={feature.included ? "" : "text-foreground-muted"}>{feature.label}</span>
                    </li>
                  ))}
                </ul>
                {plan.tier === "free" ? (
                  <Link href={user ? "/dashboard" : "/register"}><Button variant="outline" className="w-full">{plan.cta}</Button></Link>
                ) : plan.tier === "enterprise" ? (
                  <Button variant="outline" className="w-full" onClick={() => { window.location.href = "mailto:hello@typemyaudio.com"; }}>{plan.cta}</Button>
                ) : (
                  <Button className="w-full gap-2" variant={plan.popular ? "primary" : "outline"} onClick={() => plan.priceId && handleSubscribe(plan.priceId)} disabled={profile?.tier === plan.tier}>
                    {profile?.tier === plan.tier ? "Current plan" : plan.cta}
                    {profile?.tier !== plan.tier && <ArrowRight className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-16 pt-16 border-t border-border">
          <p className="editorial-display text-2xl md:text-3xl mb-4">
            Questions? <span className="editorial-italic">We&apos;re here.</span>
          </p>
          <p className="text-foreground-muted mb-6 max-w-md mx-auto">
            Reach out to our team for custom enterprise solutions or any questions about our plans.
          </p>
          <a href="mailto:hello@typemyaudio.com"><Button variant="outline">Contact Us</Button></a>
        </div>
      </main>
      <footer className="bg-foreground text-white/60">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} TypeMyAudio. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
