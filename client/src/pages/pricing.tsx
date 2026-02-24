import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "€0",
    period: "",
    description: "Try it out with 3 lifetime transcriptions",
    features: [
      { label: "3 total transcriptions (lifetime)", included: true },
      { label: "Auto language detection", included: true },
      { label: "AI grammar cleanup", included: true },
      { label: "Export to TXT, PDF, DOCX", included: true },
      { label: "Cloud storage", included: false },
      { label: "SRT subtitle export", included: false },
      { label: "Sentence-level timecodes", included: false },
    ],
    cta: "Get Started",
    tier: "free",
    popular: false,
  },
  {
    name: "Starter",
    price: "€15",
    period: "/month",
    description: "For regular users who need more transcriptions",
    features: [
      { label: "15 transcriptions/month + buy more", included: true },
      { label: "Auto language detection", included: true },
      { label: "AI grammar cleanup & summary", included: true },
      { label: "Export to TXT, PDF, DOCX", included: true },
      { label: "Cloud storage (during subscription)", included: true },
      { label: "SRT subtitle export", included: false },
      { label: "Sentence-level timecodes", included: false },
    ],
    cta: "Subscribe",
    tier: "starter",
    priceId: "price_starter_monthly",
    popular: true,
  },
  {
    name: "Annual",
    price: "€100",
    period: "/year",
    description: "Save 44% with annual billing + SRT subtitles",
    features: [
      { label: "15 transcriptions/month + buy more", included: true },
      { label: "Auto language detection", included: true },
      { label: "AI grammar cleanup & summary", included: true },
      { label: "Export to TXT, PDF, DOCX", included: true },
      { label: "Cloud storage (during subscription)", included: true },
      { label: "SRT subtitle export", included: true },
      { label: "Sentence-level timecodes", included: false },
    ],
    cta: "Subscribe",
    tier: "annual",
    priceId: "price_annual",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams and businesses with custom needs",
    features: [
      { label: "Custom transcription volume", included: true },
      { label: "Auto language detection", included: true },
      { label: "AI grammar cleanup & summary", included: true },
      { label: "Export to TXT, PDF, DOCX", included: true },
      { label: "Custom cloud storage", included: true },
      { label: "SRT subtitle export", included: true },
      { label: "Sentence-level timecodes", included: true },
    ],
    cta: "Contact Sales",
    tier: "enterprise",
    popular: false,
  },
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
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/imgs/typeMyAudioLogo.png" alt="TypeMyAudio" className="h-18 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="outline">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Choose the plan that fits your needs. Start free and upgrade when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.tier}
              className={`relative ${plan.popular ? "border-primary shadow-lg scale-[1.02]" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white px-3">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted">{plan.period}</span>
                </div>
                <p className="text-sm text-muted mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.label} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "" : "text-muted"}>{feature.label}</span>
                    </li>
                  ))}
                </ul>

                {plan.tier === "free" ? (
                  <Link to={user ? "/dashboard" : "/register"} className="block">
                    <Button variant="outline" className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : plan.tier === "enterprise" ? (
                  <Button variant="outline" className="w-full" onClick={() => window.location.href = "mailto:hello@typemyaudio.com"}>
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "primary" : "outline"}
                    onClick={() => plan.priceId && handleSubscribe(plan.priceId)}
                    disabled={profile?.tier === plan.tier}
                  >
                    {profile?.tier === plan.tier ? "Current plan" : plan.cta}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
